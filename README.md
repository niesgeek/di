# DINO Mail

A self-hosted recreation of the public [DINO Mail](https://di.fs.kg/) site and mailbox: the bilingual landing, about, privacy, and terms pages, and the `/app` client (inbox, sent, drafts, trash, compose, contacts, aliases, settings, invites).

This repository is **not** the original operator’s production system, and it is not affiliated with di.fs.kg. It recreates that public UX so you can run the same kind of mailbox on a domain you control. The pages still say di.fs.kg because that is the live site’s copy. Point them at your own domain before you send real mail (see [Your own domain](#your-own-domain)).

## Architecture

A browser loads static HTML, CSS, and JavaScript from Cloudflare. The mailbox talks only to same-origin `/api/*` routes. Those routes run in a Worker, which keeps accounts, messages, contacts, aliases, and invites in **D1** (SQLite) and talks to **Resend** for both directions of mail.

```
browser ── HTML/CSS/JS ──▶ Cloudflare static assets  (/, /about, /privacy, /terms, /app)
browser ── JSON + cookie ─▶ Worker /api/*  ──▶ D1
                              │
                              ├── POST https://api.resend.com/emails          (send)
                              └── POST /api/webhooks/resend  ◀── Resend       (inbound email.received)
                                     │
                                     └── GET /emails/receiving/:id            (body + attachments)
```

Resend receives SMTP for your domain (Forge MX `receive.forge.rmta.net`, the host the live site publishes) and POSTs an `email.received` webhook. The webhook carries metadata only. The Worker verifies the Svix signature, fetches the body from the Resend Receiving API, and writes one D1 row per local recipient (a primary address or an alias). Optional forwarding sends a copy back out through Resend. Optional Telegram notifications call the Bot API with a short summary.

Outbound mail is `POST /api/mail/send`. The Worker checks that the From address belongs to the signed-in user, calls Resend, then stores the sent copy.

Sessions are a single `dino_session` cookie: HttpOnly, SameSite=Lax, 30 days, Secure on HTTPS. The signed payload is the user id, an expiry, and a credential version. There is no session table. Changing or resetting a password bumps the version, so older cookies stop working. Passwords are PBKDF2-SHA256 (100,000 iterations) with a per-user salt.

Registration is invite-only, matching the live site. The first account can be an admin created from environment variables; that admin mints codes in the mailbox.

This Worker-plus-static-assets layout is Cloudflare’s current replacement for Pages + Pages Functions. It is the same edge runtime, the same static hosting, and the same D1 binding. A Pages Functions entry point is also included at `functions/api/[[path]].ts` if you deploy with `wrangler pages dev` instead.

## What you get

- Marketing pages with the live layout, Fraunces, dino art, and English/中文 switching (`localStorage` key `dino-lang`).
- `/app` mailbox chrome: sign in, claim an address, folders, search, stars, threads, compose with drafts, contacts, aliases, profile, password, forwarding, Telegram, export, delete account, admin invites.
- Working auth and the D1 schema.
- Send through Resend when `RESEND_API_KEY` is set. Without it, compose still saves drafts and send returns a clear error.
- Inbound webhook that stores mail. With `RESEND_API_KEY`, bodies and small attachments are fetched from Resend. Attachments over about 600 KB are listed but not kept in D1.

## Prerequisites

- Node.js 20+
- A Cloudflare account for deploy
- A domain you control, added in Resend, for real send and receive

## Local preview

```bash
npm install
cp .dev.vars.example .dev.vars
```

Put a long random `SESSION_SECRET` in `.dev.vars` (at least 16 characters). For a first inbox on your machine:

```bash
# .dev.vars
SESSION_SECRET=replace-with-openssl-rand-base64-32
BOOTSTRAP_INVITE=DINO-LOCAL-START
BOOTSTRAP_ADMIN_ADDRESS=postmaster@di.fs.kg
BOOTSTRAP_ADMIN_PASSWORD=letterpress
ALLOW_UNSIGNED_WEBHOOKS=1
```

`ALLOW_UNSIGNED_WEBHOOKS=1` accepts inbound POSTs that are not signed, and it trusts a `text` / `html` field on that payload so you can try receiving without Resend. **Do not set it on a deployed worker.**

```bash
npm run db:migrate
npm run dev
```

Open http://127.0.0.1:8787 . Claim `you@di.fs.kg` with the invite code, or sign in as the bootstrap admin and mint codes from Admin. The three domain buttons (di.fs.kg, ip.fs.kg, ok.fs.kg) are the live site’s domains; locally they are just labels in D1 until you verify them in Resend.

`npm run smoke` runs the API and page checks against that dev server.

## Environment variables

Set secrets with `npx wrangler secret put <NAME>`. Non-secrets live in `wrangler.jsonc` `vars`. Local values go in `.dev.vars` (gitignored). Nothing in this repo is a real key.

| Name | Required | Purpose |
| --- | --- | --- |
| `SESSION_SECRET` | yes, in production | HMAC key for `dino_session`. 16+ characters. |
| `RESEND_API_KEY` | to send, and to fetch inbound bodies | Resend API key. Send-only or full-access is enough if it can read receiving. |
| `RESEND_WEBHOOK_SECRET` | to receive in production | Signing secret (`whsec_…`) from the Resend webhook. |
| `MAIL_DOMAINS` | no | Comma-separated domains. Default `di.fs.kg,ip.fs.kg,ok.fs.kg`. |
| `TELEGRAM_BOT_TOKEN` | no | Bot token. Until it is set, the Telegram switch stays off and the settings page says so. |
| `BOOTSTRAP_ADMIN_ADDRESS` | no | First admin, created only while the users table is empty. Must be on `MAIL_DOMAINS`. |
| `BOOTSTRAP_ADMIN_PASSWORD` | with the address | At least 8 characters. |
| `BOOTSTRAP_INVITE` | no | An invite code inserted if it is missing. Leave empty in production and mint codes in the admin pane. |
| `ALLOW_UNSIGNED_WEBHOOKS` | no | Set to `1` only on a private dev server. |

## Resend domain and Forge MX

Do this for **your** domain. Do not copy the original operator’s DKIM records.

1. In Resend, add the domain you will send from (the live site uses `di.fs.kg`, plus `ip.fs.kg` and `ok.fs.kg` for aliases).
2. Publish the DNS Resend shows you. The live site’s pattern, which you should mirror with the values from your own dashboard, is:
   - **MX** at the domain (or a subdomain, if you prefer) pointing at Resend Forge inbound: `receive.forge.rmta.net`. Priority `10` matches the live zone. Confirm the hostname in the Resend receiving docs in case they change it; use the host Resend displays for your account.
   - **SPF** TXT: `v=spf1 include:amazonses.com ~all` (Resend sends through Amazon SES). If the dashboard shows a different SPF include, use that.
   - **DKIM**: the CNAME records Resend generates for this domain. They are unique per domain.
3. Turn on Receiving for the domain.
4. Create a webhook subscribed to `email.received`. URL: `https://<your-host>/api/webhooks/resend`. Copy the signing secret into `RESEND_WEBHOOK_SECRET`.
5. Create an API key and store it as `RESEND_API_KEY`.

Until the domain is verified, Resend will reject sends and nothing will arrive at the webhook. The mailbox UI still works.

Inbound processing:

1. Verify `svix-id`, `svix-timestamp`, and `svix-signature` against the raw body (five-minute skew).
2. Ignore events other than `email.received`.
3. `GET https://api.resend.com/emails/receiving/{email_id}` for text, HTML, and headers.
4. Deliver to each local user whose primary address or alias is in `to`, `cc`, `bcc`, or `received_for`. Retries with the same `email_id` do not insert a second copy.
5. Download attachments under about 600 KB. Larger ones are stored as a name and size only, which the reader shows as “content not kept”.
6. If forwarding is on, send a copy through Resend with `Reply-To` set to the original sender and `X-Dino-Forwarded: 1`, so a copy that lands here again is not forwarded a second time. Replies from the forwarded mailbox go to the person who wrote, which is the behavior described on the about page.
7. If Telegram is on, post a short summary (sender, subject, first lines).

## Cloudflare project and D1

```bash
npx wrangler login
npx wrangler d1 create dino-mail
```

Paste the returned `database_id` over the placeholder in `wrangler.jsonc`. Then:

```bash
npm run db:migrate:remote
npx wrangler secret put SESSION_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_WEBHOOK_SECRET
# optional:
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put BOOTSTRAP_ADMIN_ADDRESS
npx wrangler secret put BOOTSTRAP_ADMIN_PASSWORD
npm run deploy
```

`wrangler deploy` publishes the Worker and the files in `public/`. Attach your domain to the Worker (Workers custom domain or route). HTTPS is what sets the Secure flag on `dino_session`.

Logs and traces are enabled in `wrangler.jsonc` (`observability.enabled` and `observability.traces.enabled`).

The placeholder `database_id` of all zeros is only for local migrations. Replace it before a remote deploy.

### Pages-style dev

`src/index.ts` is the supported entry (`wrangler dev` / `wrangler deploy`). The same router is exported for Pages Functions:

```bash
npx wrangler pages dev public --d1 DB=dino-mail
```

Use that only if you specifically want the Pages dev pipeline. New Cloudflare projects should use `wrangler deploy`.

## Your own domain

The static copy is the live site, including `di.fs.kg`. To run it as your mailbox:

1. Set `MAIL_DOMAINS` in `wrangler.jsonc` to domains you have verified in Resend.
2. Replace `di.fs.kg`, `ip.fs.kg`, and `ok.fs.kg` in `public/*.html` and in the visible strings in `public/app.js` and `public/landing.js`.
3. Update canonical and Open Graph URLs in `public/index.html`.

Addresses are only strings in D1 until Resend will send and receive for them.

## API

The client in `public/app.js` calls these paths. All writes require a same-origin `Origin` (or `Referer`), except the Resend webhook.

| Method | Path | Role |
| --- | --- | --- |
| GET | `/api/health` | Liveness, no database. |
| GET | `/api/auth/check?local&domain` | Address availability. |
| POST | `/api/auth/register` | `{ local, domain, password, invite }` |
| POST | `/api/auth/login` | `{ address, password }` sets `dino_session`. |
| POST | `/api/auth/logout` | Clears the cookie. |
| GET | `/api/auth/me` | User and folder counts. |
| GET | `/api/mail?folder&q&before` | `in`, `out`, `drafts`, `trash`, `starred`. |
| GET | `/api/mail/counts` | Unread, starred, drafts, trash. |
| GET | `/api/mail/detail?id` | Message, attachments, thread. Marks inbox mail read. |
| DELETE | `/api/mail/detail?id&hard` | Trash, or delete forever when `hard=1`. |
| POST | `/api/mail/action` | `{ ids, action }` of `read`, `unread`, `star`, `unstar`, `trash`, `restore`, `delete`. |
| GET/POST/DELETE | `/api/mail/draft` | Autosave. POST body matches the compose form, including base64 attachments. |
| POST | `/api/mail/send` | Send via Resend, then store a sent copy. |
| GET | `/api/mail/attachment?id` | Download a stored attachment. |
| GET/POST/PATCH/DELETE | `/api/contacts` | Address book. |
| GET/POST/DELETE | `/api/aliases` | Up to 5 aliases, 6–20 characters, unless the account is an admin. |
| GET/POST | `/api/account/rules` | Forwarding and Telegram. |
| POST | `/api/account/rules/test` | Send a test copy / ping. |
| POST | `/api/account/profile` | Display name and signature. |
| POST | `/api/account/password` | `{ current, next }`. |
| GET | `/api/account/export` | JSON download of mail, contacts, aliases. |
| DELETE | `/api/account` | `{ password }` deletes the mailbox. |
| GET/POST/DELETE | `/api/admin/invites` | Admin invite codes. |
| GET | `/api/admin/users` | Admin user list. |
| POST | `/api/admin/users/reset` | `{ address }` returns a one-time temporary password and signs that user out. |
| POST | `/api/webhooks/resend` | Resend `email.received`. |

## Development

```bash
npm run typecheck
npm run db:migrate
npm run dev
npm run smoke          # with the dev server already running
npm run deploy:dry     # package check, no upload of secrets
```

Schema changes belong in a new file under `migrations/`. Wrangler records applied files in `d1_migrations`.

## Limits worth knowing

- Invite-only. There is no password reset email; an admin resets the password from the mailbox, as on the live site.
- Compose attachments: 700 KB each, 2 MB total (same as the client).
- D1 rows are size-capped, so stored attachment bytes are limited to about 600 KB and message bodies to about 400,000 characters.
- HTML from strangers is sanitized in the browser before display. Remote images stay unloaded until you ask to see them.
- Forwarding to another address on `MAIL_DOMAINS` is rejected so mail cannot loop inside this system.
