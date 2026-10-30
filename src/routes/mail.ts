import { angleMessageId, contentDisposition, formatFrom, normMessageId, parseAddressList } from "../addresses";
import { countsFor, ownsAddress, touchContact } from "../db";
import { HttpError, changes, clip, idList, json, nowSec, snippetOf, str } from "../http";
import { sendEmail } from "../resend";
import type { AppEnv, AttachmentRow, MessageRow, UserRow } from "../types";

const MAX_FILE = 700_000;
const MAX_TOTAL = 2_000_000;
const MAX_B64 = 900_000;

type IncomingFile = { filename: string; contentType: string; content: string; size: number };

function parseFiles(value: unknown): IncomingFile[] {
  if (!Array.isArray(value)) return [];
  const files: IncomingFile[] = [];
  let total = 0;
  for (const item of value.slice(0, 8)) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const filename = String(rec.filename || "attachment").replace(/[\r\n"/\\]/g, "").slice(0, 180) || "attachment";
    const contentType = String(rec.contentType || rec.content_type || "application/octet-stream").slice(0, 160);
    const content = String(rec.content || "").replace(/^data:[^,]*,/, "").replace(/\s/g, "");
    if (content && !/^[A-Za-z0-9+/=]+$/.test(content)) throw new HttpError(400, "Attachment content must be base64");
    const size = content ? Math.floor((content.length * 3) / 4) : Number(rec.size || 0);
    if (size > MAX_FILE) throw new HttpError(400, `"${filename}" is over 700 KB`);
    total += size;
    if (total > MAX_TOTAL) throw new HttpError(400, "Attachments exceed 2 MB in total");
    files.push({ filename, contentType, content, size });
  }
  return files;
}

async function replaceFiles(env: AppEnv, userId: number, messageId: number, files: IncomingFile[]): Promise<void> {
  await env.DB.prepare("DELETE FROM attachments WHERE message_id = ? AND user_id = ?").bind(messageId, userId).run();
  const now = nowSec();
  for (const file of files) {
    const stored = file.content && file.content.length <= MAX_B64 ? file.content : null;
    await env.DB.prepare(
      `INSERT INTO attachments (message_id, user_id, filename, content_type, size, content_b64, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(messageId, userId, file.filename, file.contentType, file.size, stored, now)
      .run();
  }
  await env.DB.prepare("UPDATE messages SET has_attach = ? WHERE id = ? AND user_id = ?")
    .bind(files.length ? 1 : 0, messageId, userId)
    .run();
}

function folderSql(folder: string): string {
  switch (folder) {
    case "in":
      return "m.folder = 'in' AND m.trashed_at IS NULL";
    case "out":
      return "m.folder = 'out' AND m.trashed_at IS NULL";
    case "drafts":
      return "m.folder = 'draft' AND m.trashed_at IS NULL";
    case "trash":
      return "m.trashed_at IS NOT NULL";
    case "starred":
      return "m.starred = 1 AND m.trashed_at IS NULL";
    default:
      throw new HttpError(400, "Unknown folder");
  }
}

function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

export async function listMail(env: AppEnv, user: UserRow, url: URL): Promise<Response> {
  const folder = url.searchParams.get("folder") || "in";
  const where = folderSql(folder);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 200);
  const before = url.searchParams.get("before") || "";
  const limit = 50;
  const params: unknown[] = [user.id];
  let sql = `SELECT m.id, m.folder, m.read, m.starred, m.created_at, m.from_name, m.from_addr,
                    m.to_name, m.to_addr, m.subject, m.snippet, m.has_attach,
                    CASE WHEN m.thread_key = '' THEN 1 ELSE (
                      SELECT COUNT(*) FROM messages t WHERE t.user_id = m.user_id AND t.thread_key = m.thread_key
                    ) END AS thread_count
             FROM messages m
             WHERE m.user_id = ? AND ${where}`;
  if (q) {
    sql += ` AND (m.subject LIKE ? ESCAPE '\\' OR m.from_addr LIKE ? ESCAPE '\\' OR m.from_name LIKE ? ESCAPE '\\'
             OR m.to_addr LIKE ? ESCAPE '\\' OR m.to_name LIKE ? ESCAPE '\\' OR m.snippet LIKE ? ESCAPE '\\'
             OR m.text_body LIKE ? ESCAPE '\\')`;
    const pattern = likePattern(q);
    params.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern);
  }
  if (before) {
    const [createdRaw, idRaw] = before.split(":");
    const created = Number(createdRaw);
    const id = Number(idRaw);
    if (Number.isFinite(created) && Number.isFinite(id)) {
      sql += " AND (m.created_at < ? OR (m.created_at = ? AND m.id < ?))";
      params.push(created, created, id);
    }
  }
  sql += " ORDER BY m.created_at DESC, m.id DESC LIMIT ?";
  params.push(limit);
  const rows = await env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>();
  const mails = rows.results || [];
  let nextBefore: string | null = null;
  if (mails.length === limit) {
    const last = mails[mails.length - 1];
    nextBefore = `${last.created_at}:${last.id}`;
  }
  const counts = await countsFor(env.DB, user.id);
  return json({ mails, nextBefore, counts });
}

export async function mailCounts(env: AppEnv, user: UserRow): Promise<Response> {
  return json({ counts: await countsFor(env.DB, user.id) });
}

async function ownedMessage(env: AppEnv, userId: number, id: number): Promise<MessageRow> {
  const row = await env.DB.prepare("SELECT * FROM messages WHERE id = ? AND user_id = ?").bind(id, userId).first<MessageRow>();
  if (!row) throw new HttpError(404, "Message not found");
  return row;
}

export async function mailDetail(env: AppEnv, user: UserRow, url: URL): Promise<Response> {
  const id = Number(url.searchParams.get("id") || "0");
  const mail = await ownedMessage(env, user.id, id);
  if (mail.folder === "in" && !mail.read && !mail.trashed_at) {
    await env.DB.prepare("UPDATE messages SET read = 1 WHERE id = ? AND user_id = ?").bind(id, user.id).run();
    mail.read = 1;
  }
  const attachments = await env.DB.prepare(
    "SELECT id, filename, content_type, size, content_b64 IS NOT NULL AS stored FROM attachments WHERE message_id = ? AND user_id = ?",
  )
    .bind(id, user.id)
    .all<{ id: number; filename: string; content_type: string; size: number; stored: number }>();
  let thread: { id: number; from_name: string; from_addr: string; subject: string; created_at: number }[] = [];
  if (mail.thread_key) {
    const rows = await env.DB.prepare(
      `SELECT id, from_name, from_addr, subject, created_at FROM messages
       WHERE user_id = ? AND thread_key = ? AND id != ? AND trashed_at IS NULL
       ORDER BY created_at ASC`,
    )
      .bind(user.id, mail.thread_key, id)
      .all<{ id: number; from_name: string; from_addr: string; subject: string; created_at: number }>();
    thread = rows.results || [];
  }
  return json({
    mail,
    attachments: (attachments.results || []).map((item) => ({
      id: item.id,
      filename: item.filename,
      contentType: item.content_type,
      size: item.size,
      stored: item.stored ? 1 : 0,
    })),
    thread,
    counts: await countsFor(env.DB, user.id),
  });
}

export async function deleteMail(env: AppEnv, user: UserRow, url: URL): Promise<Response> {
  const id = Number(url.searchParams.get("id") || "0");
  const hard = url.searchParams.get("hard") === "1";
  const mail = await ownedMessage(env, user.id, id);
  if (hard || mail.trashed_at || mail.folder === "draft") {
    await env.DB.prepare("DELETE FROM attachments WHERE message_id = ? AND user_id = ?").bind(id, user.id).run();
    await env.DB.prepare("DELETE FROM messages WHERE id = ? AND user_id = ?").bind(id, user.id).run();
  } else {
    await env.DB.prepare("UPDATE messages SET trashed_at = ? WHERE id = ? AND user_id = ?").bind(nowSec(), id, user.id).run();
  }
  return json({ ok: true, counts: await countsFor(env.DB, user.id) });
}

export async function mailAction(env: AppEnv, user: UserRow, body: Record<string, unknown>): Promise<Response> {
  const ids = idList(body.ids);
  const action = str(body, "action");
  if (!ids.length) throw new HttpError(400, "No messages selected");
  const marks = ids.map(() => "?").join(",");
  const where = `user_id = ? AND id IN (${marks})`;
  const args = [user.id, ...ids];
  if (action === "read" || action === "unread") {
    await env.DB.prepare(`UPDATE messages SET read = ? WHERE ${where}`).bind(action === "read" ? 1 : 0, ...args).run();
  } else if (action === "star" || action === "unstar") {
    await env.DB.prepare(`UPDATE messages SET starred = ? WHERE ${where}`).bind(action === "star" ? 1 : 0, ...args).run();
  } else if (action === "trash") {
    await env.DB.prepare(`UPDATE messages SET trashed_at = ? WHERE ${where} AND trashed_at IS NULL`).bind(nowSec(), ...args).run();
  } else if (action === "restore") {
    await env.DB.prepare(`UPDATE messages SET trashed_at = NULL WHERE ${where}`).bind(...args).run();
  } else if (action === "delete") {
    await env.DB.prepare(`DELETE FROM attachments WHERE user_id = ? AND message_id IN (${marks})`).bind(...args).run();
    await env.DB.prepare(`DELETE FROM messages WHERE ${where}`).bind(...args).run();
  } else {
    throw new HttpError(400, "Unknown action");
  }
  return json({ ok: true, counts: await countsFor(env.DB, user.id) });
}

function draftView(row: MessageRow, files: AttachmentRow[]) {
  return {
    id: row.id,
    to: row.to_addr,
    cc: row.cc_addr,
    bcc: row.bcc_addr,
    subject: row.subject,
    text: row.text_body,
    from: row.from_addr,
    inReplyTo: row.reply_to_id || 0,
    attachments: files.map((file) => ({
      filename: file.filename,
      contentType: file.content_type,
      size: file.size,
      content: file.content_b64 || "",
    })),
  };
}

export async function getDraft(env: AppEnv, user: UserRow, url: URL): Promise<Response> {
  const id = Number(url.searchParams.get("id") || "0");
  const row = await ownedMessage(env, user.id, id);
  if (row.folder !== "draft") throw new HttpError(404, "Draft not found");
  const files = await env.DB.prepare("SELECT * FROM attachments WHERE message_id = ? AND user_id = ?")
    .bind(id, user.id)
    .all<AttachmentRow>();
  return json({ draft: draftView(row, files.results || []) });
}

export async function saveDraft(env: AppEnv, user: UserRow, body: Record<string, unknown>): Promise<Response> {
  const id = Number(body.id || 0);
  const to = str(body, "to").trim().slice(0, 2000);
  const cc = str(body, "cc").trim().slice(0, 2000);
  const bcc = str(body, "bcc").trim().slice(0, 2000);
  const subject = str(body, "subject").slice(0, 500);
  const text = clip(str(body, "text"));
  const from = str(body, "from").trim().toLowerCase() || user.address;
  const replyTo = Number(body.inReplyTo || 0) || null;
  if (!(await ownsAddress(env.DB, user.id, from))) throw new HttpError(400, "That From address is not yours");
  const files = parseFiles(body.attachments);
  const now = nowSec();
  let draftId = id;
  if (draftId) {
    const existing = await ownedMessage(env, user.id, draftId);
    if (existing.folder !== "draft") throw new HttpError(404, "Draft not found");
    await env.DB.prepare(
      `UPDATE messages SET from_addr = ?, to_addr = ?, cc_addr = ?, bcc_addr = ?, subject = ?, text_body = ?,
         snippet = ?, reply_to_id = ?, created_at = ? WHERE id = ? AND user_id = ?`,
    )
      .bind(from, to, cc, bcc, subject, text, snippetOf(text), replyTo, now, draftId, user.id)
      .run();
  } else {
    const inserted = await env.DB.prepare(
      `INSERT INTO messages (
         user_id, folder, read, starred, from_addr, to_addr, cc_addr, bcc_addr, subject, snippet, text_body,
         reply_to_id, created_at
       ) VALUES (?, 'draft', 1, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(user.id, from, to, cc, bcc, subject, snippetOf(text), text, replyTo, now)
      .run();
    draftId = Number(inserted.meta?.last_row_id || 0);
  }
  await replaceFiles(env, user.id, draftId, files);
  return json({ id: draftId });
}

export async function deleteDraft(env: AppEnv, user: UserRow, url: URL): Promise<Response> {
  const id = Number(url.searchParams.get("id") || "0");
  const row = await ownedMessage(env, user.id, id);
  if (row.folder !== "draft") throw new HttpError(400, "That message is not a draft");
  await env.DB.prepare("DELETE FROM attachments WHERE message_id = ? AND user_id = ?").bind(id, user.id).run();
  const removed = await env.DB.prepare("DELETE FROM messages WHERE id = ? AND user_id = ?").bind(id, user.id).run();
  if (changes(removed) !== 1) throw new HttpError(404, "Draft not found");
  return json({ ok: true });
}

export async function sendMail(env: AppEnv, user: UserRow, body: Record<string, unknown>): Promise<Response> {
  const to = parseAddressList(str(body, "to"));
  const cc = parseAddressList(str(body, "cc"));
  const bcc = parseAddressList(str(body, "bcc"));
  if (!to.length) throw new HttpError(400, "Add at least one recipient");
  if (to.length + cc.length + bcc.length > 50) throw new HttpError(400, "Too many recipients");
  const text = str(body, "text");
  if (!text.trim()) throw new HttpError(400, "Message body is empty");
  const subject = str(body, "subject").slice(0, 500);
  const from = str(body, "from").trim().toLowerCase() || user.address;
  if (!(await ownsAddress(env.DB, user.id, from))) throw new HttpError(400, "That From address is not yours");
  const files = parseFiles(body.attachments);
  const replyToId = Number(body.inReplyTo || 0);
  let parent: MessageRow | null = null;
  if (replyToId) parent = await ownedMessage(env, user.id, replyToId);

  if (!env.RESEND_API_KEY) throw new HttpError(503, "Sending is not configured yet. Set RESEND_API_KEY.");

  const domain = from.split("@")[1] || user.domain;
  const messageId = `${crypto.randomUUID()}@${domain}`;
  const headers: Record<string, string> = {};
  let threadKey = messageId;
  let inReply = "";
  let references = "";
  if (parent) {
    threadKey = parent.thread_key || parent.message_id || messageId;
    if (parent.message_id) {
      inReply = parent.message_id;
      references = [parent.references_hdr, parent.message_id].filter(Boolean).join(" ");
      headers["In-Reply-To"] = angleMessageId(parent.message_id);
      headers["References"] = references
        .split(/\s+/)
        .filter(Boolean)
        .map(angleMessageId)
        .join(" ");
    }
  }

  let sent: { id: string };
  try {
    sent = await sendEmail(env.RESEND_API_KEY, {
    from: formatFrom(user.display_name, from),
    to,
    cc,
    bcc,
    subject: subject || "(no subject)",
    text,
    headers,
    attachments: files
      .filter((file) => file.content)
      .map((file) => ({ filename: file.filename, content: file.content, content_type: file.contentType })),
  });
  } catch (err) {
    throw new HttpError(502, err instanceof Error ? err.message : "Sending failed");
  }

  const now = nowSec();
  const inserted = await env.DB.prepare(
    `INSERT INTO messages (
       user_id, folder, read, starred, from_addr, from_name, to_addr, to_name, cc_addr, bcc_addr,
       subject, snippet, text_body, message_id, in_reply_to, references_hdr, thread_key, reply_to_id,
       has_attach, resend_id, created_at
     ) VALUES (?, 'out', 1, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      user.id,
      from,
      user.display_name,
      to.join(", "),
      "",
      cc.join(", "),
      bcc.join(", "),
      subject,
      snippetOf(text),
      clip(text),
      normMessageId(messageId),
      normMessageId(inReply),
      references
        .split(/\s+/)
        .map(normMessageId)
        .filter(Boolean)
        .join(" "),
      normMessageId(threadKey),
      replyToId || null,
      files.length ? 1 : 0,
      sent.id,
      now,
    )
    .run();
  const id = Number(inserted.meta?.last_row_id || 0);
  await replaceFiles(env, user.id, id, files);

  const draftId = Number(body.draftId || 0);
  if (draftId) {
    await env.DB.prepare("DELETE FROM attachments WHERE message_id = ? AND user_id = ?").bind(draftId, user.id).run();
    await env.DB.prepare("DELETE FROM messages WHERE id = ? AND user_id = ? AND folder = 'draft'").bind(draftId, user.id).run();
  }
  for (const address of [...to, ...cc, ...bcc]) await touchContact(env.DB, user.id, address);
  return json({ ok: true, id });
}

export async function downloadAttachment(env: AppEnv, user: UserRow, url: URL): Promise<Response> {
  const id = Number(url.searchParams.get("id") || "0");
  const row = await env.DB.prepare("SELECT * FROM attachments WHERE id = ? AND user_id = ?").bind(id, user.id).first<AttachmentRow>();
  if (!row || !row.content_b64) throw new HttpError(404, "Attachment not found");
  const bin = atob(row.content_b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Response(bytes, {
    headers: {
      "content-type": row.content_type || "application/octet-stream",
      "content-disposition": contentDisposition(row.filename),
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
