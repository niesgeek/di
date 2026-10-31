import { checkLocal, domainOf, mailDomains, parseMailbox } from "../addresses";
import { hashPassword, inviteCode, tempPassword, verifyPassword } from "../crypto";
import { addressTaken, publicUser } from "../db";
import { HttpError, boolish, changes, isSecureRequest, json, nowSec, str } from "../http";
import { deliverRules } from "../notify";
import { clearSessionCookie, requireSecret, sealSession, sessionCookie } from "../session";
import type { AppEnv, UserRow } from "../types";

function rulesView(env: AppEnv, user: UserRow) {
  return {
    forward_on: user.forward_on ? 1 : 0,
    forward_to: user.forward_to,
    forward_last_at: user.forward_last_at,
    forward_last_error: user.forward_last_error,
    tg_on: user.tg_on ? 1 : 0,
    tg_chat: user.tg_chat,
    tg_last_at: user.tg_last_at,
    tg_last_error: user.tg_last_error,
    telegram_ready: env.TELEGRAM_BOT_TOKEN ? 1 : 0,
  };
}

export function getRules(env: AppEnv, user: UserRow): Response {
  return json(rulesView(env, user));
}

export async function saveRules(env: AppEnv, user: UserRow, body: Record<string, unknown>): Promise<Response> {
  const forwardTo = str(body, "forward_to").trim().toLowerCase();
  const forwardOn = boolish(body.forward_on);
  const tgChat = str(body, "tg_chat").trim();
  let tgOn = boolish(body.tg_on);
  if (forwardTo) {
    const parsed = parseMailbox(forwardTo);
    if (!parsed) throw new HttpError(400, "Forwarding address is not an email");
    if (parsed.address === user.address) throw new HttpError(400, "You can't forward mail to yourself");
    if (mailDomains(env).includes(domainOf(parsed.address))) {
      throw new HttpError(400, "Forward to an address outside this mailbox");
    }
  } else if (forwardOn) {
    throw new HttpError(400, "Add an address to forward to");
  }
  if (tgChat && !/^-?\d{4,20}$/.test(tgChat) && !/^@[A-Za-z][A-Za-z0-9_]{3,}$/.test(tgChat)) {
    throw new HttpError(400, "Chat ID should be a number, a group id like -100…, or @channel");
  }
  if (tgOn && !env.TELEGRAM_BOT_TOKEN) tgOn = false;
  if (tgOn && !tgChat) throw new HttpError(400, "Add a Telegram chat ID");
  await env.DB.prepare(
    "UPDATE users SET forward_to = ?, forward_on = ?, tg_chat = ?, tg_on = ? WHERE id = ?",
  )
    .bind(forwardTo, forwardOn ? 1 : 0, tgChat, tgOn ? 1 : 0, user.id)
    .run();
  user.forward_to = forwardTo;
  user.forward_on = forwardOn ? 1 : 0;
  user.tg_chat = tgChat;
  user.tg_on = tgOn ? 1 : 0;
  return json(rulesView(env, user));
}

export async function testRules(env: AppEnv, user: UserRow, body: Record<string, unknown>): Promise<Response> {
  const forwardTo = str(body, "forward_to").trim();
  const chat = str(body, "tg_chat").trim();
  if (!forwardTo && !chat) throw new HttpError(400, "Fill in an address or a chat ID first.");
  const result = await deliverRules(
    env,
    user,
    { from: user.address, subject: "DINO Mail test", text: "Test" },
    { test: true, forceForward: forwardTo, forceChat: chat },
  );
  return json(result);
}

export async function saveProfile(env: AppEnv, user: UserRow, body: Record<string, unknown>): Promise<Response> {
  const displayName = str(body, "display_name").replace(/[\r\n]/g, "").trim().slice(0, 60);
  const signature = str(body, "signature").slice(0, 2000);
  await env.DB.prepare("UPDATE users SET display_name = ?, signature = ? WHERE id = ?")
    .bind(displayName, signature, user.id)
    .run();
  return json({ display_name: displayName, signature });
}

export async function changePassword(env: AppEnv, request: Request, user: UserRow, body: Record<string, unknown>): Promise<Response> {
  const current = str(body, "current");
  const next = str(body, "next");
  if (next.length < 8) throw new HttpError(400, "Password must be at least 8 characters");
  if (!(await verifyPassword(current, user.password_hash, user.password_salt))) {
    throw new HttpError(400, "Current password is wrong");
  }
  const hashed = await hashPassword(next);
  const version = user.session_version + 1;
  await env.DB.prepare("UPDATE users SET password_hash = ?, password_salt = ?, session_version = ? WHERE id = ?")
    .bind(hashed.hash, hashed.salt, version, user.id)
    .run();
  const token = await sealSession(requireSecret(env.SESSION_SECRET), user.id, version);
  const response = json({ ok: true });
  response.headers.set("set-cookie", sessionCookie(token, isSecureRequest(request)));
  return response;
}

export async function exportAccount(env: AppEnv, user: UserRow): Promise<Response> {
  const aliases = await env.DB.prepare("SELECT address, label, created_at FROM aliases WHERE user_id = ? ORDER BY id")
    .bind(user.id)
    .all();
  const contacts = await env.DB.prepare("SELECT address, name, note, starred, created_at FROM contacts WHERE user_id = ? ORDER BY id")
    .bind(user.id)
    .all();
  const messages = await env.DB.prepare(
    `SELECT id, folder, read, starred, trashed_at, from_addr, from_name, to_addr, to_name, cc_addr, bcc_addr,
            subject, text_body, html_body, message_id, created_at
     FROM messages WHERE user_id = ? ORDER BY created_at`,
  )
    .bind(user.id)
    .all();
  const attachments = await env.DB.prepare(
    "SELECT id, message_id, filename, content_type, size, content_b64 FROM attachments WHERE user_id = ?",
  )
    .bind(user.id)
    .all();
  const payload = {
    exported_at: new Date().toISOString(),
    user: publicUser(user),
    aliases: aliases.results || [],
    contacts: contacts.results || [],
    messages: messages.results || [],
    attachments: attachments.results || [],
  };
  const filename = `dino-mail-export-${new Date().toISOString().slice(0, 10)}.json`;
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

export async function deleteAccount(env: AppEnv, request: Request, user: UserRow, body: Record<string, unknown>): Promise<Response> {
  const password = str(body, "password");
  if (!(await verifyPassword(password, user.password_hash, user.password_salt))) {
    throw new HttpError(400, "Current password is wrong");
  }
  await env.DB.batch([
    env.DB.prepare("DELETE FROM attachments WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM messages WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM contacts WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM aliases WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id),
  ]);
  const response = json({ ok: true });
  response.headers.set("set-cookie", clearSessionCookie(isSecureRequest(request)));
  return response;
}

export async function listContacts(env: AppEnv, user: UserRow, url: URL): Promise<Response> {
  const q = (url.searchParams.get("q") || "").trim().slice(0, 200);
  if (q) {
    const pattern = `%${q.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
    const rows = await env.DB.prepare(
      `SELECT id, address, name, note, starred FROM contacts
       WHERE user_id = ? AND (address LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' OR note LIKE ? ESCAPE '\\')
       ORDER BY starred DESC, name COLLATE NOCASE, address COLLATE NOCASE`,
    )
      .bind(user.id, pattern, pattern, pattern)
      .all();
    return json({ contacts: rows.results || [] });
  }
  const rows = await env.DB.prepare(
    `SELECT id, address, name, note, starred FROM contacts
     WHERE user_id = ? ORDER BY starred DESC, name COLLATE NOCASE, address COLLATE NOCASE`,
  )
    .bind(user.id)
    .all();
  return json({ contacts: rows.results || [] });
}

export async function createContact(env: AppEnv, user: UserRow, body: Record<string, unknown>): Promise<Response> {
  const parsed = parseMailbox(str(body, "address"));
  if (!parsed) throw new HttpError(400, "That doesn't look like an email address");
  const name = str(body, "name").trim().slice(0, 80);
  const now = nowSec();
  try {
    const inserted = await env.DB.prepare(
      "INSERT INTO contacts (user_id, address, name, note, starred, created_at) VALUES (?, ?, ?, '', 0, ?)",
    )
      .bind(user.id, parsed.address, name, now)
      .run();
    return json({ id: Number(inserted.meta?.last_row_id || 0) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/UNIQUE/i.test(message)) throw new HttpError(409, "That contact is already in your book");
    throw err;
  }
}

export async function patchContact(env: AppEnv, user: UserRow, body: Record<string, unknown>): Promise<Response> {
  const id = Number(body.id || 0);
  if (!id) throw new HttpError(400, "Missing contact");
  const existing = await env.DB.prepare("SELECT id FROM contacts WHERE id = ? AND user_id = ?").bind(id, user.id).first();
  if (!existing) throw new HttpError(404, "Contact not found");
  if ("starred" in body) {
    await env.DB.prepare("UPDATE contacts SET starred = ? WHERE id = ? AND user_id = ?")
      .bind(boolish(body.starred) ? 1 : 0, id, user.id)
      .run();
  }
  if ("name" in body) {
    await env.DB.prepare("UPDATE contacts SET name = ? WHERE id = ? AND user_id = ?")
      .bind(str(body, "name").trim().slice(0, 80), id, user.id)
      .run();
  }
  return json({ ok: true });
}

export async function deleteContact(env: AppEnv, user: UserRow, url: URL): Promise<Response> {
  const id = Number(url.searchParams.get("id") || "0");
  const removed = await env.DB.prepare("DELETE FROM contacts WHERE id = ? AND user_id = ?").bind(id, user.id).run();
  if (changes(removed) !== 1) throw new HttpError(404, "Contact not found");
  return json({ ok: true });
}

export async function listAliases(env: AppEnv, user: UserRow): Promise<Response> {
  const rows = await env.DB.prepare(
    "SELECT id, address, label, created_at FROM aliases WHERE user_id = ? ORDER BY created_at DESC",
  )
    .bind(user.id)
    .all();
  return json({ aliases: rows.results || [] });
}

export async function createAlias(env: AppEnv, user: UserRow, body: Record<string, unknown>): Promise<Response> {
  const local = str(body, "local").trim().toLowerCase();
  const domain = str(body, "domain").trim().toLowerCase();
  const admin = !!user.is_admin;
  const verdict = checkLocal(local, domain, env, admin ? { min: 1, max: 64, allowReserved: true } : { min: 6, max: 20 });
  if (!verdict.ok) throw new HttpError(400, verdict.message);
  if (!admin) {
    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM aliases WHERE user_id = ?").bind(user.id).first<{ n: number }>();
    if (Number(count?.n || 0) >= 5) throw new HttpError(400, "Free accounts can have up to 5 aliases");
  }
  const address = `${local}@${domain}`;
  if (await addressTaken(env.DB, address)) throw new HttpError(409, "That address is already taken");
  const inserted = await env.DB.prepare(
    "INSERT INTO aliases (user_id, local_part, domain, address, label, created_at) VALUES (?, ?, ?, ?, '', ?)",
  )
    .bind(user.id, local, domain, address, nowSec())
    .run();
  return json({ id: Number(inserted.meta?.last_row_id || 0), address });
}

export async function deleteAlias(env: AppEnv, user: UserRow, url: URL): Promise<Response> {
  const id = Number(url.searchParams.get("id") || "0");
  const removed = await env.DB.prepare("DELETE FROM aliases WHERE id = ? AND user_id = ?").bind(id, user.id).run();
  if (changes(removed) !== 1) throw new HttpError(404, "Alias not found");
  return json({ ok: true });
}

function requireAdmin(user: UserRow): void {
  if (!user.is_admin) throw new HttpError(403, "Admin only");
}

export async function listInvites(env: AppEnv, user: UserRow): Promise<Response> {
  requireAdmin(user);
  const rows = await env.DB.prepare("SELECT code, used_by, used_at, created_at FROM invites ORDER BY created_at DESC LIMIT 200").all();
  return json({ invites: rows.results || [] });
}

export async function createInvite(env: AppEnv, user: UserRow): Promise<Response> {
  requireAdmin(user);
  const code = inviteCode();
  await env.DB.prepare("INSERT INTO invites (code, created_by, created_at) VALUES (?, ?, ?)")
    .bind(code, user.id, nowSec())
    .run();
  return json({ code });
}

export async function revokeInvite(env: AppEnv, user: UserRow, url: URL): Promise<Response> {
  requireAdmin(user);
  const code = (url.searchParams.get("code") || "").trim().toUpperCase();
  const removed = await env.DB.prepare("DELETE FROM invites WHERE code = ? AND used_by IS NULL").bind(code).run();
  if (changes(removed) !== 1) throw new HttpError(404, "That code is already used or gone");
  return json({ ok: true });
}

export async function listUsers(env: AppEnv, user: UserRow): Promise<Response> {
  requireAdmin(user);
  const rows = await env.DB.prepare(
    `SELECT u.address, u.display_name, u.created_at, u.is_admin,
            (SELECT COUNT(*) FROM messages m WHERE m.user_id = u.id) AS mails
     FROM users u ORDER BY u.created_at ASC`,
  ).all();
  return json({ users: rows.results || [] });
}

export async function resetUser(env: AppEnv, user: UserRow, body: Record<string, unknown>): Promise<Response> {
  requireAdmin(user);
  const parsed = parseMailbox(str(body, "address"));
  if (!parsed) throw new HttpError(400, "Unknown address");
  const target = await env.DB.prepare("SELECT id, session_version FROM users WHERE address = ?")
    .bind(parsed.address)
    .first<{ id: number; session_version: number }>();
  if (!target) throw new HttpError(404, "No such mailbox");
  const temp = tempPassword();
  const hashed = await hashPassword(temp);
  await env.DB.prepare("UPDATE users SET password_hash = ?, password_salt = ?, session_version = ? WHERE id = ?")
    .bind(hashed.hash, hashed.salt, target.session_version + 1, target.id)
    .run();
  return json({ temp });
}
