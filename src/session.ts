import { base64url, base64urlDecode, hmacSha256B64Url, timingSafeEqualStr } from "./crypto";
import { HttpError } from "./http";

const COOKIE = "dino_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export type SessionPayload = { u: number; e: number; v: number };

export async function sealSession(secret: string, userId: number, version: number): Promise<string> {
  const payload: SessionPayload = {
    u: userId,
    e: Math.floor(Date.now() / 1000) + MAX_AGE,
    v: version,
  };
  const body = base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const mac = await hmacSha256B64Url(secret, body);
  return `${body}.${mac}`;
}

export async function openSession(secret: string, token: string): Promise<SessionPayload | null> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = await hmacSha256B64Url(secret, body);
  if (!timingSafeEqualStr(mac, expected)) return null;
  try {
    const json = JSON.parse(new TextDecoder().decode(base64urlDecode(body))) as Partial<SessionPayload>;
    if (typeof json.u !== "number" || typeof json.e !== "number" || typeof json.v !== "number") return null;
    if (json.e < Math.floor(Date.now() / 1000)) return null;
    return { u: json.u, e: json.e, v: json.v };
  } catch {
    return null;
  }
}

export function readCookie(header: string | null, name = COOKIE): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (key === name) return part.slice(eq + 1).trim();
  }
  return null;
}

export function sessionCookie(token: string, secure: boolean): string {
  const parts = [`${COOKIE}=${token}`, "HttpOnly", "Path=/", "SameSite=Lax", `Max-Age=${MAX_AGE}`];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(secure: boolean): string {
  const parts = [`${COOKIE}=`, "HttpOnly", "Path=/", "SameSite=Lax", "Max-Age=0"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function requireSecret(secret: string | undefined): string {
  if (!secret || secret.length < 16) {
    throw new HttpError(500, "SESSION_SECRET is not set");
  }
  return secret;
}
