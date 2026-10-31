-- DINO Mail mailbox. Times are unix seconds.

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_part TEXT NOT NULL,
  domain TEXT NOT NULL,
  address TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  signature TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  session_version INTEGER NOT NULL DEFAULT 1,
  forward_to TEXT NOT NULL DEFAULT '',
  forward_on INTEGER NOT NULL DEFAULT 0,
  forward_last_at INTEGER,
  forward_last_error TEXT NOT NULL DEFAULT '',
  tg_chat TEXT NOT NULL DEFAULT '',
  tg_on INTEGER NOT NULL DEFAULT 0,
  tg_last_at INTEGER,
  tg_last_error TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

CREATE TABLE invites (
  code TEXT PRIMARY KEY,
  created_by INTEGER,
  created_at INTEGER NOT NULL,
  used_by TEXT,
  used_at INTEGER
);

CREATE TABLE aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  local_part TEXT NOT NULL,
  domain TEXT NOT NULL,
  address TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX aliases_user ON aliases(user_id);

CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  address TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  starred INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, address)
);
CREATE INDEX contacts_user ON contacts(user_id);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  folder TEXT NOT NULL CHECK (folder IN ('in', 'out', 'draft')),
  read INTEGER NOT NULL DEFAULT 0,
  starred INTEGER NOT NULL DEFAULT 0,
  trashed_at INTEGER,
  from_addr TEXT NOT NULL DEFAULT '',
  from_name TEXT NOT NULL DEFAULT '',
  to_addr TEXT NOT NULL DEFAULT '',
  to_name TEXT NOT NULL DEFAULT '',
  cc_addr TEXT NOT NULL DEFAULT '',
  bcc_addr TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  snippet TEXT NOT NULL DEFAULT '',
  text_body TEXT NOT NULL DEFAULT '',
  html_body TEXT NOT NULL DEFAULT '',
  message_id TEXT NOT NULL DEFAULT '',
  in_reply_to TEXT NOT NULL DEFAULT '',
  references_hdr TEXT NOT NULL DEFAULT '',
  thread_key TEXT NOT NULL DEFAULT '',
  reply_to_id INTEGER,
  has_attach INTEGER NOT NULL DEFAULT 0,
  resend_id TEXT NOT NULL DEFAULT '',
  provider_email_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX messages_list ON messages(user_id, created_at DESC, id DESC);
CREATE INDEX messages_thread ON messages(user_id, thread_key);
CREATE UNIQUE INDEX messages_provider ON messages(user_id, provider_email_id);

CREATE TABLE attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size INTEGER NOT NULL DEFAULT 0,
  content_b64 TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX attachments_message ON attachments(message_id);
CREATE INDEX attachments_user ON attachments(user_id);
