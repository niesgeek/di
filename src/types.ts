export interface AppEnv {
  DB: D1Database;
  MAIL_DOMAINS?: string;
  SESSION_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_WEBHOOK_SECRET?: string;
  TELEGRAM_BOT_TOKEN?: string;
  BOOTSTRAP_ADMIN_ADDRESS?: string;
  BOOTSTRAP_ADMIN_PASSWORD?: string;
  BOOTSTRAP_INVITE?: string;
  ALLOW_UNSIGNED_WEBHOOKS?: string;
}

export interface WorkerEnv extends AppEnv {
  ASSETS: Fetcher;
}

export interface WaitCtx {
  waitUntil(promise: Promise<unknown>): void;
}

export type UserRow = {
  id: number;
  local_part: string;
  domain: string;
  address: string;
  display_name: string;
  signature: string;
  password_hash: string;
  password_salt: string;
  is_admin: number;
  session_version: number;
  forward_to: string;
  forward_on: number;
  forward_last_at: number | null;
  forward_last_error: string;
  tg_chat: string;
  tg_on: number;
  tg_last_at: number | null;
  tg_last_error: string;
  created_at: number;
};

export type MessageRow = {
  id: number;
  user_id: number;
  folder: string;
  read: number;
  starred: number;
  trashed_at: number | null;
  from_addr: string;
  from_name: string;
  to_addr: string;
  to_name: string;
  cc_addr: string;
  bcc_addr: string;
  subject: string;
  snippet: string;
  text_body: string;
  html_body: string;
  message_id: string;
  in_reply_to: string;
  references_hdr: string;
  thread_key: string;
  reply_to_id: number | null;
  has_attach: number;
  resend_id: string;
  provider_email_id: string | null;
  created_at: number;
};

export type AttachmentRow = {
  id: number;
  message_id: number;
  user_id: number;
  filename: string;
  content_type: string;
  size: number;
  content_b64: string | null;
  created_at: number;
};

export type Counts = {
  inbox_unread: number;
  starred: number;
  drafts: number;
  trash: number;
};
