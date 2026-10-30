import { bytesToBase64 } from "./crypto";

export type ResendAttachment = {
  filename: string;
  content: string;
  content_type?: string;
};

export type SendInput = {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  attachments?: ResendAttachment[];
};

type ResendErrorBody = { message?: string; error?: string };

export async function sendEmail(apiKey: string, input: SendInput): Promise<{ id: string }> {
  const body: Record<string, unknown> = {
    from: input.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
  };
  if (input.cc?.length) body.cc = input.cc;
  if (input.bcc?.length) body.bcc = input.bcc;
  if (input.html) body.html = input.html;
  if (input.replyTo) body.reply_to = input.replyTo;
  if (input.headers && Object.keys(input.headers).length) body.headers = input.headers;
  if (input.attachments?.length) {
    body.attachments = input.attachments.map((item) => ({
      filename: item.filename,
      content: item.content,
      content_type: item.content_type || "application/octet-stream",
    }));
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as ResendErrorBody & { id?: string };
  if (!response.ok || !data.id) {
    const message = data.message || data.error || `Resend rejected the message (${response.status})`;
    throw new Error(typeof message === "string" ? message : "Resend rejected the message");
  }
  return { id: data.id };
}

export type ReceivedEmail = {
  html: string;
  text: string;
  headers: Record<string, string>;
  message_id: string;
  from: string;
  subject: string;
};

export async function getReceivedEmail(apiKey: string, emailId: string): Promise<ReceivedEmail | null> {
  const response = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (response.status === 404) return null;
  const data = (await response.json().catch(() => ({}))) as {
    html?: string | null;
    text?: string | null;
    headers?: Record<string, string>;
    message_id?: string;
    from?: string;
    subject?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(data.message || `Could not fetch received mail (${response.status})`);
  }
  return {
    html: data.html || "",
    text: data.text || "",
    headers: data.headers || {},
    message_id: data.message_id || "",
    from: data.from || "",
    subject: data.subject || "",
  };
}

export async function downloadReceivedAttachment(apiKey: string, emailId: string, attachmentId: string): Promise<Uint8Array | null> {
  const meta = await fetch(
    `https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}/attachments/${encodeURIComponent(attachmentId)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  if (!meta.ok) return null;
  const body = (await meta.json().catch(() => ({}))) as { download_url?: string };
  if (!body.download_url) return null;
  const file = await fetch(body.download_url);
  if (!file.ok) return null;
  return new Uint8Array(await file.arrayBuffer());
}

export function toBase64(bytes: Uint8Array): string {
  return bytesToBase64(bytes);
}

export async function verifySvix(secret: string, messageId: string, timestamp: string, signature: string, payload: string): Promise<boolean> {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > 60 * 5) return false;
  const raw = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  let keyBytes: Uint8Array;
  try {
    const bin = atob(raw);
    keyBytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) keyBytes[i] = bin.charCodeAt(i);
  } catch {
    return false;
  }
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = `${messageId}.${timestamp}.${payload}`;
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signed)));
  let expected = "";
  for (const b of mac) expected += String.fromCharCode(b);
  expected = btoa(expected);
  const parts = signature.split(/\s+/);
  for (const part of parts) {
    const sig = part.startsWith("v1,") ? part.slice(3) : part;
    if (sig.length === expected.length && timingSafe(sig, expected)) return true;
  }
  return false;
}

function timingSafe(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
