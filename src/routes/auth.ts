import { checkLocal, parseMailbox } from "../addresses";
import { hashPassword, verifyPassword } from "../crypto";
import { addressTaken, countsFor, publicUser } from "../db";
import { HttpError, changes, isSecureRequest, json, nowSec, str } from "../http";
import { clearSessionCookie, requireSecret, sealSession, sessionCookie } from "../session";
import type { AppEnv, UserRow } from "../types";

export async function authCheck(env: AppEnv, url: URL): Promise<Response> {
  const local = (url.searchParams.get("local") || "").trim().toLowerCase();
  const domain = (url.searchParams.get("domain") || "").trim().toLowerCase();
  const verdict = checkLocal(local, domain, env);
  if (!verdict.ok) return json(verdict);
  const address = `${local}@${domain}`;
  if (await addressTaken(env.DB, address)) {
    return json({ ok: false, reason: "taken", message: "That address is already taken" });
  }
  return json({ ok: true });
}

export async function register(env: AppEnv, request: Request, body: Record<string, unknown>): Promise<Response> {
  requireSecret(env.SESSION_SECRET);
  const local = str(body, "local").trim().toLowerCase();
  const domain = str(body, "domain").trim().toLowerCase();
  const password = str(body, "password");
  const invite = str(body, "invite").trim().toUpperCase();
  const verdict = checkLocal(local, domain, env);
  if (!verdict.ok) throw new HttpError(400, verdict.message);
  if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters");
  if (!invite) throw new HttpError(400, "Invite code is required");

  const address = `${local}@${domain}`;
  if (await addressTaken(env.DB, address)) throw new HttpError(409, "That address is already taken");

  const now = nowSec();
  const claimed = await env.DB.prepare(
    "UPDATE invites SET used_by = ?, used_at = ? WHERE code = ? AND used_by IS NULL",
  )
    .bind(address, now, invite)
    .run();
  if (changes(claimed) !== 1) throw new HttpError(400, "Invite code is not valid");

  try {
    const hashed = await hashPassword(password);
    const inserted = await env.DB.prepare(
      `INSERT INTO users (
         local_part, domain, address, display_name, signature, password_hash, password_salt, is_admin, session_version, created_at
       ) VALUES (?, ?, ?, '', '', ?, ?, 0, 1, ?)`,
    )
      .bind(local, domain, address, hashed.hash, hashed.salt, now)
      .run();
    const id = Number(inserted.meta?.last_row_id || 0);
    const token = await sealSession(requireSecret(env.SESSION_SECRET), id, 1);
    const response = json({ ok: true });
    response.headers.set("set-cookie", sessionCookie(token, isSecureRequest(request)));
    return response;
  } catch (err) {
    await env.DB.prepare("UPDATE invites SET used_by = NULL, used_at = NULL WHERE code = ? AND used_by = ?")
      .bind(invite, address)
      .run();
    const message = err instanceof Error ? err.message : String(err);
    if (/UNIQUE/i.test(message)) throw new HttpError(409, "That address is already taken");
    throw err;
  }
}

export async function login(env: AppEnv, request: Request, body: Record<string, unknown>): Promise<Response> {
  const parsed = parseMailbox(str(body, "address"));
  const password = str(body, "password");
  if (!parsed || !password) throw new HttpError(400, "Address and password are required");
  const user = await env.DB.prepare("SELECT * FROM users WHERE address = ?").bind(parsed.address).first<UserRow>();
  const matches = user ? await verifyPassword(password, user.password_hash, user.password_salt) : false;
  if (!user || !matches) throw new HttpError(401, "That address and password don't match");
  const token = await sealSession(requireSecret(env.SESSION_SECRET), user.id, user.session_version);
  const response = json({ ok: true });
  response.headers.set("set-cookie", sessionCookie(token, isSecureRequest(request)));
  return response;
}

export function logout(request: Request): Response {
  const response = json({ ok: true });
  response.headers.set("set-cookie", clearSessionCookie(isSecureRequest(request)));
  return response;
}

export async function me(env: AppEnv, user: UserRow | null): Promise<Response> {
  if (!user) throw new HttpError(401, "Sign in required");
  const counts = await countsFor(env.DB, user.id);
  return json({ user: publicUser(user), counts });
}
