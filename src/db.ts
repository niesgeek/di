import { hashPassword } from "./crypto";
import { parseMailbox } from "./addresses";
import { mailDomains } from "./addresses";
import { nowSec } from "./http";
import type { AppEnv, Counts, UserRow } from "./types";

export async function countsFor(db: D1Database, userId: number): Promise<Counts> {
  const row = await db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN folder = 'in' AND trashed_at IS NULL AND read = 0 THEN 1 ELSE 0 END), 0) AS inbox_unread,
         COALESCE(SUM(CASE WHEN starred = 1 AND trashed_at IS NULL THEN 1 ELSE 0 END), 0) AS starred,
         COALESCE(SUM(CASE WHEN folder = 'draft' AND trashed_at IS NULL THEN 1 ELSE 0 END), 0) AS drafts,
         COALESCE(SUM(CASE WHEN trashed_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS trash
       FROM messages WHERE user_id = ?`,
    )
    .bind(userId)
    .first<Counts>();
  return {
    inbox_unread: Number(row?.inbox_unread || 0),
    starred: Number(row?.starred || 0),
    drafts: Number(row?.drafts || 0),
    trash: Number(row?.trash || 0),
  };
}

export async function userById(db: D1Database, id: number): Promise<UserRow | null> {
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<UserRow>();
}

export function publicUser(user: UserRow) {
  return {
    address: user.address,
    display_name: user.display_name,
    signature: user.signature,
    is_admin: user.is_admin ? 1 : 0,
  };
}

export async function addressTaken(db: D1Database, address: string): Promise<boolean> {
  const user = await db.prepare("SELECT 1 AS n FROM users WHERE address = ?").bind(address).first();
  if (user) return true;
  const alias = await db.prepare("SELECT 1 AS n FROM aliases WHERE address = ?").bind(address).first();
  return !!alias;
}

export async function ownsAddress(db: D1Database, userId: number, address: string): Promise<boolean> {
  const user = await db.prepare("SELECT 1 AS n FROM users WHERE id = ? AND address = ?").bind(userId, address).first();
  if (user) return true;
  const alias = await db.prepare("SELECT 1 AS n FROM aliases WHERE user_id = ? AND address = ?").bind(userId, address).first();
  return !!alias;
}

export async function touchContact(db: D1Database, userId: number, address: string, name = ""): Promise<void> {
  const clean = address.trim().toLowerCase();
  if (!clean.includes("@")) return;
  const existing = await db
    .prepare("SELECT id, name FROM contacts WHERE user_id = ? AND address = ?")
    .bind(userId, clean)
    .first<{ id: number; name: string }>();
  if (!existing) {
    await db
      .prepare("INSERT INTO contacts (user_id, address, name, note, starred, created_at) VALUES (?, ?, ?, '', 0, ?)")
      .bind(userId, clean, name.trim().slice(0, 80), nowSec())
      .run();
    return;
  }
  if (name.trim() && !existing.name) {
    await db.prepare("UPDATE contacts SET name = ? WHERE id = ?").bind(name.trim().slice(0, 80), existing.id).run();
  }
}

export async function ensureBootstrap(env: AppEnv): Promise<void> {
  const now = nowSec();
  const invite = (env.BOOTSTRAP_INVITE || "").trim().toUpperCase();
  if (invite) {
    await env.DB.prepare("INSERT OR IGNORE INTO invites (code, created_at) VALUES (?, ?)").bind(invite, now).run();
  }

  const addressRaw = (env.BOOTSTRAP_ADMIN_ADDRESS || "").trim().toLowerCase();
  const password = env.BOOTSTRAP_ADMIN_PASSWORD || "";
  if (!addressRaw || password.length < 8) return;

  const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first<{ n: number }>();
  if (count && Number(count.n) > 0) return;

  const parsed = parseMailbox(addressRaw);
  if (!parsed) return;
  const domain = parsed.address.split("@")[1] || "";
  const local = parsed.address.split("@")[0] || "";
  if (!mailDomains(env).includes(domain)) return;

  const hashed = await hashPassword(password);
  try {
    await env.DB.prepare(
      `INSERT INTO users (
         local_part, domain, address, display_name, signature, password_hash, password_salt, is_admin, session_version, created_at
       ) VALUES (?, ?, ?, '', '', ?, ?, 1, 1, ?)`,
    )
      .bind(local, domain, parsed.address, hashed.hash, hashed.salt, now)
      .run();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!/UNIQUE/i.test(message)) throw err;
  }
}
