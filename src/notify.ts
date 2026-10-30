import { formatFrom, parseMailbox } from "./addresses";
import { nowSec, snippetOf } from "./http";
import { sendEmail } from "./resend";
import type { AppEnv, UserRow } from "./types";

export type NotifyResult = {
  forward?: { ok: boolean; error?: string };
  telegram?: { ok: boolean; error?: string };
};

export async function deliverRules(
  env: AppEnv,
  user: Pick<UserRow, "id" | "address" | "display_name" | "forward_to" | "forward_on" | "tg_chat" | "tg_on">,
  mail: { from: string; subject: string; text: string; html?: string },
  opts?: { test?: boolean; forceForward?: string; forceChat?: string },
): Promise<NotifyResult> {
  const result: NotifyResult = {};
  const forwardTo = (opts?.forceForward ?? (user.forward_on ? user.forward_to : "")).trim();
  const chat = (opts?.forceChat ?? (user.tg_on ? user.tg_chat : "")).trim();
  const now = nowSec();

  if (forwardTo) {
    const parsed = parseMailbox(forwardTo);
    if (!env.RESEND_API_KEY) {
      result.forward = { ok: false, error: "RESEND_API_KEY is not set" };
    } else if (!parsed) {
      result.forward = { ok: false, error: "Forwarding address is not an email" };
    } else {
      try {
        await sendEmail(env.RESEND_API_KEY, {
          from: formatFrom(user.display_name || "DINO Mail", user.address),
          to: [parsed.address],
          subject: opts?.test ? "DINO Mail forwarding test" : mail.subject || "(no subject)",
          text: opts?.test
            ? "This is a test copy from your DINO Mail mailbox. Forwarding is wired up."
            : mail.text || "",
          html: opts?.test ? undefined : mail.html,
          replyTo: opts?.test ? user.address : mail.from || user.address,
          headers: opts?.test ? undefined : { "X-Dino-Forwarded": "1" },
        });
        result.forward = { ok: true };
      } catch (err) {
        result.forward = { ok: false, error: err instanceof Error ? err.message : "Forward failed" };
      }
    }
    if (!opts?.test) {
      await env.DB.prepare("UPDATE users SET forward_last_at = ?, forward_last_error = ? WHERE id = ?")
        .bind(now, result.forward?.error || "", user.id)
        .run();
    }
  }

  if (chat) {
    if (!env.TELEGRAM_BOT_TOKEN) {
      result.telegram = { ok: false, error: "TELEGRAM_BOT_TOKEN is not set" };
    } else {
      const text = opts?.test
        ? "DINO Mail test — if you can read this, notifications are wired up."
        : [
            `New mail for ${user.address}`,
            `From: ${mail.from || "unknown"}`,
            `Subject: ${mail.subject || "(no subject)"}`,
            "",
            snippetOf(mail.text || "").slice(0, 400),
          ].join("\n");
      try {
        const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
        });
        const data = (await response.json().catch(() => ({}))) as { ok?: boolean; description?: string };
        if (!response.ok || data.ok === false) {
          result.telegram = { ok: false, error: data.description || `Telegram error ${response.status}` };
        } else {
          result.telegram = { ok: true };
        }
      } catch (err) {
        result.telegram = { ok: false, error: err instanceof Error ? err.message : "Telegram failed" };
      }
    }
    if (!opts?.test) {
      await env.DB.prepare("UPDATE users SET tg_last_at = ?, tg_last_error = ? WHERE id = ?")
        .bind(now, result.telegram?.error || "", user.id)
        .run();
    }
  }

  return result;
}
