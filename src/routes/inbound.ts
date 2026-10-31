import { normMessageId, parseAddressList, parseMailbox } from "../addresses";
import { touchContact } from "../db";
import { HttpError, clip, json, nowSec, snippetOf } from "../http";
import { deliverRules } from "../notify";
import { downloadReceivedAttachment, getReceivedEmail, toBase64, verifySvix } from "../resend";
import type { AppEnv, UserRow, WaitCtx } from "../types";

const MAX_STORED = 600_000;

type WebhookAttachment = {
  id?: string;
  filename?: string;
  content_type?: string;
  size?: number;
};

type WebhookData = {
  email_id?: string;
  from?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  received_for?: string[];
  subject?: string;
  message_id?: string;
  text?: string;
  html?: string;
  created_at?: string;
  headers?: Record<string, string>;
  attachments?: WebhookAttachment[];
};

function headerValue(headers: Record<string, string> | undefined, name: string): string {
  if (!headers) return "";
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target && typeof value === "string") return value;
  }
  return "";
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function findOwner(env: AppEnv, address: string): Promise<{ userId: number; matched: string } | null> {
  const user = await env.DB.prepare("SELECT id, address FROM users WHERE address = ?").bind(address).first<{ id: number; address: string }>();
  if (user) return { userId: user.id, matched: user.address };
  const alias = await env.DB.prepare("SELECT user_id, address FROM aliases WHERE address = ?")
    .bind(address)
    .first<{ user_id: number; address: string }>();
  if (alias) return { userId: alias.user_id, matched: alias.address };
  return null;
}

async function threadKeyFor(env: AppEnv, userId: number, messageId: string, inReplyTo: string, references: string): Promise<string> {
  const candidates = [inReplyTo, ...references.split(/\s+/)].map(normMessageId).filter(Boolean);
  for (const id of candidates) {
    const row = await env.DB.prepare(
      "SELECT thread_key, message_id FROM messages WHERE user_id = ? AND message_id = ? LIMIT 1",
    )
      .bind(userId, id)
      .first<{ thread_key: string; message_id: string }>();
    if (row) return row.thread_key || row.message_id || id;
  }
  return normMessageId(messageId) || candidates[0] || crypto.randomUUID();
}

export async function receiveWebhook(env: AppEnv, request: Request, ctx: WaitCtx): Promise<Response> {
  const payload = await request.text();
  if (payload.length > 1_000_000) throw new HttpError(413, "Webhook payload is too large");
  const allowUnsigned = env.ALLOW_UNSIGNED_WEBHOOKS === "1";
  const secret = env.RESEND_WEBHOOK_SECRET || "";
  if (secret) {
    const ok = await verifySvix(
      secret,
      request.headers.get("svix-id") || "",
      request.headers.get("svix-timestamp") || "",
      request.headers.get("svix-signature") || "",
      payload,
    );
    if (!ok) throw new HttpError(401, "Invalid webhook signature");
  } else if (!allowUnsigned) {
    throw new HttpError(401, "RESEND_WEBHOOK_SECRET is not set");
  }

  let event: { type?: string; data?: WebhookData };
  try {
    event = JSON.parse(payload) as { type?: string; data?: WebhookData };
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
  if (event.type !== "email.received") return json({ ok: true, ignored: true });
  const data = event.data || {};
  const emailId = String(data.email_id || "").trim();
  if (!emailId) throw new HttpError(400, "Missing email_id");

  let text = "";
  let html = "";
  let headers = data.headers || {};
  let messageId = String(data.message_id || "");
  let fromRaw = String(data.from || "");
  let subject = String(data.subject || "");
  if (env.RESEND_API_KEY) {
    try {
      const full = await getReceivedEmail(env.RESEND_API_KEY, emailId);
      if (full) {
        text = full.text || "";
        html = full.html || "";
        headers = { ...headers, ...full.headers };
        messageId = full.message_id || messageId;
        fromRaw = headerValue(full.headers, "from") || full.from || fromRaw;
        subject = full.subject || subject;
      }
    } catch (err) {
      if (!allowUnsigned) throw new HttpError(502, err instanceof Error ? err.message : "Could not fetch the message");
    }
  }
  if (allowUnsigned) {
    if (!text && data.text) text = String(data.text);
    if (!html && data.html) html = String(data.html);
  }
  if (!text && html) text = htmlToText(html);

  const from = parseMailbox(fromRaw) || { name: "", address: fromRaw.trim().toLowerCase() };
  const recipients = [
    ...(data.to || []),
    ...(data.cc || []),
    ...(data.bcc || []),
    ...(data.received_for || []),
  ].flatMap((item) => parseAddressList(String(item)));
  const owners = new Map<number, string[]>();
  for (const address of recipients) {
    const owner = await findOwner(env, address);
    if (!owner) continue;
    const list = owners.get(owner.userId) || [];
    list.push(owner.matched);
    owners.set(owner.userId, list);
  }
  if (!owners.size) {
    console.log(JSON.stringify({ event: "inbound_unmatched", email_id: emailId }));
    return json({ ok: true, stored: 0 });
  }

  const inReplyTo = headerValue(headers, "in-reply-to");
  const references = headerValue(headers, "references");
  const forwarded = headerValue(headers, "x-dino-forwarded") === "1";
  const cc = (data.cc || []).flatMap((item) => parseAddressList(String(item))).join(", ");
  const created = data.created_at ? Math.floor(Date.parse(data.created_at) / 1000) : nowSec();
  const when = Number.isFinite(created) && created > 0 ? created : nowSec();
  let stored = 0;

  for (const [userId, matched] of owners) {
    const existing = await env.DB.prepare("SELECT id FROM messages WHERE user_id = ? AND provider_email_id = ?")
      .bind(userId, emailId)
      .first();
    if (existing) continue;
    const threadKey = await threadKeyFor(env, userId, messageId, inReplyTo, references);
    const inserted = await env.DB.prepare(
      `INSERT INTO messages (
         user_id, folder, read, starred, from_addr, from_name, to_addr, cc_addr, subject, snippet,
         text_body, html_body, message_id, in_reply_to, references_hdr, thread_key, has_attach,
         provider_email_id, created_at
       ) VALUES (?, 'in', 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        userId,
        from.address,
        from.name.slice(0, 120),
        [...new Set(matched)].join(", "),
        cc,
        subject.slice(0, 500),
        snippetOf(text || subject),
        clip(text),
        clip(html),
        normMessageId(messageId),
        normMessageId(inReplyTo),
        references.split(/\s+/).map(normMessageId).filter(Boolean).join(" "),
        threadKey,
        data.attachments?.length ? 1 : 0,
        emailId,
        when,
      )
      .run();
    const messageRowId = Number(inserted.meta?.last_row_id || 0);
    stored += 1;
    if (from.address) await touchContact(env.DB, userId, from.address, from.name);

    if (env.RESEND_API_KEY && data.attachments?.length) {
      let kept = 0;
      for (const attachment of data.attachments.slice(0, 8)) {
        if (!attachment.id) continue;
        const filename = String(attachment.filename || "attachment").slice(0, 180);
        const contentType = String(attachment.content_type || "application/octet-stream").slice(0, 160);
        let b64: string | null = null;
        let size = Number(attachment.size || 0);
        try {
          const bytes = await downloadReceivedAttachment(env.RESEND_API_KEY, emailId, attachment.id);
          if (bytes && bytes.byteLength <= MAX_STORED) {
            b64 = toBase64(bytes);
            size = bytes.byteLength;
          } else if (bytes) {
            size = bytes.byteLength;
          }
        } catch {
          b64 = null;
        }
        await env.DB.prepare(
          `INSERT INTO attachments (message_id, user_id, filename, content_type, size, content_b64, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
          .bind(messageRowId, userId, filename, contentType, size, b64, when)
          .run();
        if (b64) kept += 1;
      }
      await env.DB.prepare("UPDATE messages SET has_attach = ? WHERE id = ?").bind(kept ? 1 : data.attachments.length ? 1 : 0, messageRowId).run();
    }

    const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first<UserRow>();
    if (user && !forwarded && (user.forward_on || user.tg_on)) {
      ctx.waitUntil(
        deliverRules(env, user, { from: from.address, subject, text, html }).catch((err) => {
          console.log(JSON.stringify({ event: "notify_failed", user: user.address, message: err instanceof Error ? err.message : String(err) }));
        }),
      );
    }
  }

  return json({ ok: true, stored });
}
