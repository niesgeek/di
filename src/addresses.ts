import { HttpError, isReservedLocal } from "./http";
import type { AppEnv } from "./types";

const EMAIL_RE = /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i;

export function mailDomains(env: AppEnv): string[] {
  const raw = env.MAIL_DOMAINS || "di.fs.kg,ip.fs.kg,ok.fs.kg";
  return raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

export function parseMailbox(raw: string): { name: string; address: string } | null {
  const text = raw.trim();
  if (!text) return null;
  const angle = text.match(/^(.*?)<([^>]+)>$/);
  if (angle) {
    const address = angle[2].trim().toLowerCase();
    const name = angle[1].replace(/^["']|["']$/g, "").trim();
    if (address.includes("@")) return { name, address };
  }
  const match = text.match(EMAIL_RE);
  if (!match) return null;
  return { name: "", address: match[1].toLowerCase() };
}

export function parseAddressList(raw: string): string[] {
  if (!raw.trim()) return [];
  const out: string[] = [];
  for (const part of raw.split(/[,;]/)) {
    const parsed = parseMailbox(part);
    if (parsed) out.push(parsed.address);
  }
  return [...new Set(out)];
}

export function validLocal(local: string, min = 2, max = 34): boolean {
  if (local.length < min || local.length > max) return false;
  if (!/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(local)) return false;
  if (local.includes("..")) return false;
  return true;
}

export function domainOf(address: string): string {
  const at = address.lastIndexOf("@");
  return at === -1 ? "" : address.slice(at + 1).toLowerCase();
}

export function assertOurDomain(env: AppEnv, domain: string): void {
  if (!mailDomains(env).includes(domain)) {
    throw new HttpError(400, "That domain is not served here");
  }
}

export type AddressCheck = { ok: true } | { ok: false; reason: string; message: string };

export function checkLocal(local: string, domain: string, env: AppEnv, opts?: { min?: number; max?: number; allowReserved?: boolean }): AddressCheck {
  const min = opts?.min ?? 2;
  const max = opts?.max ?? 34;
  if (!validLocal(local, min, max)) {
    return { ok: false, reason: "format", message: `${min}-${max} characters: letters, digits, dot, dash, underscore` };
  }
  if (!mailDomains(env).includes(domain)) {
    return { ok: false, reason: "domain", message: "That domain is not served here" };
  }
  if (!opts?.allowReserved && isReservedLocal(local)) {
    return { ok: false, reason: "reserved", message: "That name is reserved" };
  }
  return { ok: true };
}

export function formatFrom(name: string, address: string): string {
  const clean = name.replace(/[\r\n"]/g, "").trim().slice(0, 60);
  if (!clean) return address;
  return `${clean} <${address}>`;
}

export function normMessageId(value: string): string {
  return value.trim().replace(/^<|>$/g, "").toLowerCase();
}

export function angleMessageId(value: string): string {
  const id = value.trim();
  if (!id) return "";
  return id.startsWith("<") ? id : `<${id}>`;
}

export function contentDisposition(filename: string): string {
  const clean = filename.replace(/[\r\n"]/g, "").slice(0, 180) || "attachment";
  const ascii = clean.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(clean)}`;
}
