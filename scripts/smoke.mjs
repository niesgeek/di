#!/usr/bin/env node
// End-to-end check against a local `wrangler dev` server.
const base = process.env.BASE || "http://127.0.0.1:8787";

function cookieJar() {
  const jar = new Map();
  return {
    header() {
      return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    absorb(response) {
      const list = typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [response.headers.get("set-cookie")].filter(Boolean);
      for (const raw of list) {
        const [pair] = raw.split(";");
        const eq = pair.indexOf("=");
        const name = pair.slice(0, eq).trim();
        const value = pair.slice(eq + 1).trim();
        if (!value) jar.delete(name);
        else jar.set(name, value);
      }
    },
  };
}

async function api(jar, path, opts = {}) {
  const headers = new Headers(opts.headers || {});
  if (!headers.has("origin")) headers.set("origin", base);
  if (jar.header()) headers.set("cookie", jar.header());
  if (opts.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(base + path, { ...opts, headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  jar.absorb(response);
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: response.status, data, text, headers: response.headers };
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

const pages = ["/", "/about", "/privacy", "/terms", "/app", "/no-such-letter"];
for (const path of pages) {
  const response = await fetch(base + path, { redirect: "manual" });
  const html = await response.text();
  console.log(path, response.status, response.headers.get("content-type"));
  if (path === "/no-such-letter") {
    assert(response.status === 404, "missing page should be 404");
    assert(html.includes("This letter got lost"), "404 copy");
  } else {
    assert(response.status === 200, `${path} should be 200, got ${response.status}`);
    assert(html.includes("DINO"), `${path} should mention DINO`);
    assert(!html.includes("cloudflareinsights"), `${path} must not ship the original analytics beacon`);
  }
}

const anon = cookieJar();
const health = await api(anon, "/api/health");
assert(health.status === 200 && health.data.ok, "health");

const check = await api(anon, "/api/auth/check?local=ada&domain=di.fs.kg");
assert(check.data.ok === true, "ada should be available: " + JSON.stringify(check.data));

const reserved = await api(anon, "/api/auth/check?local=abuse&domain=di.fs.kg");
assert(reserved.data.ok === false, "abuse is reserved");

const me0 = await api(anon, "/api/auth/me");
assert(me0.status === 401, "me without cookie");

const ada = cookieJar();
const reg = await api(ada, "/api/auth/register", {
  method: "POST",
  body: { local: "ada", domain: "di.fs.kg", password: "letterpress", invite: "DINO-LOCAL-START" },
});
assert(reg.status === 200, "register: " + JSON.stringify(reg.data));
assert(ada.header().includes("dino_session"), "session cookie");

const again = await api(cookieJar(), "/api/auth/register", {
  method: "POST",
  body: { local: "ada2", domain: "di.fs.kg", password: "letterpress", invite: "DINO-LOCAL-START" },
});
assert(again.status === 400, "invite is single use");

const me = await api(ada, "/api/auth/me");
assert(me.status === 200 && me.data.user.address === "ada@di.fs.kg", "me");
assert(me.data.user.is_admin === 0, "ada is not admin");

const cross = await fetch(base + "/api/auth/logout", {
  method: "POST",
  headers: { origin: "https://evil.example", cookie: ada.header() },
});
assert(cross.status === 403, "cross-site write blocked");

const draft = await api(ada, "/api/mail/draft", {
  method: "POST",
  body: { id: 0, to: "sam@example.com", subject: "A note", text: "Hello from the cliff", from: "ada@di.fs.kg" },
});
assert(draft.status === 200 && draft.data.id, "draft: " + JSON.stringify(draft.data));

const drafts = await api(ada, "/api/mail?folder=drafts");
assert(drafts.data.mails.length === 1, "draft is listed");

const send = await api(ada, "/api/mail/send", {
  method: "POST",
  body: { to: "sam@example.com", subject: "Out", text: "Going out", from: "ada@di.fs.kg", draftId: draft.data.id },
});
assert(send.status === 503, "send without Resend key explains itself: " + JSON.stringify(send.data));

const inbound = await api(cookieJar(), "/api/webhooks/resend", {
  method: "POST",
  body: {
    type: "email.received",
    data: {
      email_id: "local-smoke-1",
      from: "Sam Writer <sam@example.com>",
      to: ["ada@di.fs.kg"],
      cc: ["other@example.com"],
      subject: "The sea is calm",
      message_id: "<local-smoke-1@example.com>",
      text: "Come sit on the cliff.",
      html: "<p>Come sit on the cliff.</p>",
    },
  },
});
assert(inbound.status === 200 && inbound.data.stored === 1, "inbound stored: " + JSON.stringify(inbound.data));

const dup = await api(cookieJar(), "/api/webhooks/resend", {
  method: "POST",
  body: {
    type: "email.received",
    data: { email_id: "local-smoke-1", from: "sam@example.com", to: ["ada@di.fs.kg"], subject: "again", text: "dup" },
  },
});
assert(dup.status === 200 && dup.data.stored === 0, "duplicate webhook is ignored");

const inbox = await api(ada, "/api/mail?folder=in");
assert(inbox.data.mails.length === 1, "inbox has the letter");
assert(inbox.data.mails[0].from_name === "Sam Writer", "display name kept");
assert(inbox.data.counts.inbox_unread === 1, "unread count");
const id = inbox.data.mails[0].id;

const detail = await api(ada, "/api/mail/detail?id=" + id);
assert(detail.data.mail.text_body.includes("cliff"), "body stored");
assert(detail.data.mail.html_body.includes("<p>"), "html stored");

const counts = await api(ada, "/api/mail/counts");
assert(counts.data.counts.inbox_unread === 0, "opening marks read");

const star = await api(ada, "/api/mail/action", { method: "POST", body: { ids: [id], action: "star" } });
assert(star.data.counts.starred === 1, "starred");

const contact = await api(ada, "/api/contacts", { method: "POST", body: { address: "friend@example.com", name: "Friend" } });
assert(contact.status === 200, "contact");
const contacts = await api(ada, "/api/contacts?q=friend");
assert(contacts.data.contacts.length === 1, "contact search");

const shortAlias = await api(ada, "/api/aliases", { method: "POST", body: { local: "hi", domain: "di.fs.kg" } });
assert(shortAlias.status === 400, "short alias rejected");
const alias = await api(ada, "/api/aliases", { method: "POST", body: { local: "adaletters", domain: "ip.fs.kg" } });
assert(alias.status === 200, "alias: " + JSON.stringify(alias.data));

const aliasMail = await api(cookieJar(), "/api/webhooks/resend", {
  method: "POST",
  body: {
    type: "email.received",
    data: {
      email_id: "local-smoke-alias",
      from: "post@example.com",
      to: ["adaletters@ip.fs.kg"],
      subject: "Via alias",
      text: "Landed on the alias.",
    },
  },
});
assert(aliasMail.data.stored === 1, "alias delivery");

const profile = await api(ada, "/api/account/profile", {
  method: "POST",
  body: { display_name: "Ada", signature: "— ada" },
});
assert(profile.data.display_name === "Ada", "profile");

const rules = await api(ada, "/api/account/rules", {
  method: "POST",
  body: { forward_to: "ada@elsewhere.test", forward_on: true, tg_chat: "", tg_on: false },
});
assert(rules.data.forward_on === 1 && rules.data.telegram_ready === 0, "rules saved");

const testRules = await api(ada, "/api/account/rules/test", {
  method: "POST",
  body: { forward_to: "ada@elsewhere.test", tg_chat: "" },
});
assert(testRules.data.forward && testRules.data.forward.ok === false, "forward test reports missing key");

const exported = await fetch(base + "/api/account/export", { headers: { cookie: ada.header() } });
assert(exported.status === 200, "export");
const blob = await exported.json();
assert(blob.user.address === "ada@di.fs.kg" && blob.messages.length >= 2, "export contents");

const forbidden = await api(ada, "/api/admin/invites");
assert(forbidden.status === 403, "ada cannot admin");

const admin = cookieJar();
const adminLogin = await api(admin, "/api/auth/login", {
  method: "POST",
  body: { address: "postmaster@di.fs.kg", password: "letterpress" },
});
assert(adminLogin.status === 200, "admin login: " + JSON.stringify(adminLogin.data));
const invites = await api(admin, "/api/admin/invites", { method: "POST" });
assert(invites.status === 200 && invites.data.code.startsWith("DINO-"), "mint invite");
const users = await api(admin, "/api/admin/users");
assert(users.data.users.some((u) => u.address === "ada@di.fs.kg"), "user list");

const badPw = await api(ada, "/api/account/password", {
  method: "POST",
  body: { current: "nope", next: "letterpress2" },
});
assert(badPw.status === 400, "wrong current password");

const pw = await api(ada, "/api/account/password", {
  method: "POST",
  body: { current: "letterpress", next: "letterpress2" },
});
assert(pw.status === 200, "password changed");
const still = await api(ada, "/api/auth/me");
assert(still.status === 200, "current browser stays signed in");

const old = cookieJar();
const oldLogin = await api(old, "/api/auth/login", {
  method: "POST",
  body: { address: "ada@di.fs.kg", password: "letterpress" },
});
assert(oldLogin.status === 401, "old password rejected");

await api(ada, "/api/auth/logout", { method: "POST" });
const gone = await api(ada, "/api/auth/me");
assert(gone.status === 401, "logged out");

console.log("smoke ok");
