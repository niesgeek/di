export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  const h = new Headers(headers);
  h.set("content-type", "application/json; charset=utf-8");
  h.set("cache-control", "no-store");
  h.set("x-content-type-options", "nosniff");
  return new Response(JSON.stringify(data), { status, headers: h });
}

export function error(status: number, message: string, headers?: HeadersInit): Response {
  return json({ error: message }, status, headers);
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const len = Number(request.headers.get("content-length") || "0");
  if (len > 4_000_000) throw new HttpError(413, "Request is too large");
  const text = await request.text();
  if (text.length > 4_000_000) throw new HttpError(413, "Request is too large");
  if (!text.trim()) return {};
  try {
    const data: unknown = JSON.parse(text);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new HttpError(400, "Expected a JSON object");
    }
    return data as Record<string, unknown>;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, "Invalid JSON");
  }
}

export function str(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

export function boolish(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function idList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const ids = value.map((item) => Number(item)).filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(ids)].slice(0, 100);
}

export function sameOrigin(request: Request): boolean {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin) return origin !== "null" && origin === url.origin;
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    return new URL(referer).origin === url.origin;
  } catch {
    return false;
  }
}

export function isSecureRequest(request: Request): boolean {
  if (new URL(request.url).protocol === "https:") return true;
  return request.headers.get("x-forwarded-proto") === "https";
}

export function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

export function clip(value: string, max = 400_000): string {
  if (value.length <= max) return value;
  return value.slice(0, max) + "\n\n[truncated]";
}

export function snippetOf(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= 160) return flat;
  return flat.slice(0, 157) + "…";
}

export function changes(result: D1Result): number {
  return Number(result.meta?.changes || 0);
}

const RESERVED = new Set([
  "abuse",
  "admin",
  "administrator",
  "hostmaster",
  "info",
  "mail",
  "mailer-daemon",
  "no-reply",
  "noreply",
  "postmaster",
  "privacy",
  "root",
  "security",
  "support",
  "webmaster",
  "www",
]);

export function isReservedLocal(local: string): boolean {
  return RESERVED.has(local);
}
