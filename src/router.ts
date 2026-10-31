import { HttpError, error, json, readJson, sameOrigin } from "./http";
import { openSession, readCookie } from "./session";
import { ensureBootstrap, userById } from "./db";
import { login, logout, me, authCheck, register } from "./routes/auth";
import {
  createAlias,
  createContact,
  createInvite,
  changePassword,
  deleteAccount,
  deleteAlias,
  deleteContact,
  exportAccount,
  getRules,
  listAliases,
  listContacts,
  listInvites,
  listUsers,
  patchContact,
  resetUser,
  revokeInvite,
  saveProfile,
  saveRules,
  testRules,
} from "./routes/account";
import { receiveWebhook } from "./routes/inbound";
import {
  deleteDraft,
  deleteMail,
  downloadAttachment,
  getDraft,
  listMail,
  mailAction,
  mailCounts,
  mailDetail,
  saveDraft,
  sendMail,
} from "./routes/mail";
import type { AppEnv, UserRow, WaitCtx } from "./types";

const WRITE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function handleRequest(request: Request, env: AppEnv, ctx: WaitCtx): Promise<Response> {
  const url = new URL(request.url);
  let path = url.pathname;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  const method = request.method.toUpperCase();

  if (method === "GET" && path === "/api/health") {
    return json({ ok: true, service: "dino-mail" });
  }

  try {
    if (!env.DB) throw new HttpError(500, "D1 binding DB is missing");
    await ensureBootstrap(env);

    if (method === "POST" && path === "/api/webhooks/resend") {
      return await receiveWebhook(env, request, ctx);
    }

    if (WRITE.has(method) && !sameOrigin(request)) {
      throw new HttpError(403, "Cross-site request blocked");
    }

    const user = await loadUser(env, request);

    if (method === "GET" && path === "/api/auth/check") return await authCheck(env, url);
    if (method === "POST" && path === "/api/auth/register") return await register(env, request, await readJson(request));
    if (method === "POST" && path === "/api/auth/login") return await login(env, request, await readJson(request));
    if (method === "POST" && path === "/api/auth/logout") return logout(request);
    if (method === "GET" && path === "/api/auth/me") return await me(env, user);

    const signedIn = requireUser(user);

    if (method === "GET" && path === "/api/mail") return await listMail(env, signedIn, url);
    if (method === "GET" && path === "/api/mail/counts") return await mailCounts(env, signedIn);
    if (method === "GET" && path === "/api/mail/detail") return await mailDetail(env, signedIn, url);
    if (method === "DELETE" && path === "/api/mail/detail") return await deleteMail(env, signedIn, url);
    if (method === "POST" && path === "/api/mail/action") return await mailAction(env, signedIn, await readJson(request));
    if (method === "GET" && path === "/api/mail/draft") return await getDraft(env, signedIn, url);
    if (method === "POST" && path === "/api/mail/draft") return await saveDraft(env, signedIn, await readJson(request));
    if (method === "DELETE" && path === "/api/mail/draft") return await deleteDraft(env, signedIn, url);
    if (method === "POST" && path === "/api/mail/send") return await sendMail(env, signedIn, await readJson(request));
    if (method === "GET" && path === "/api/mail/attachment") return await downloadAttachment(env, signedIn, url);

    if (method === "GET" && path === "/api/contacts") return await listContacts(env, signedIn, url);
    if (method === "POST" && path === "/api/contacts") return await createContact(env, signedIn, await readJson(request));
    if (method === "PATCH" && path === "/api/contacts") return await patchContact(env, signedIn, await readJson(request));
    if (method === "DELETE" && path === "/api/contacts") return await deleteContact(env, signedIn, url);

    if (method === "GET" && path === "/api/aliases") return await listAliases(env, signedIn);
    if (method === "POST" && path === "/api/aliases") return await createAlias(env, signedIn, await readJson(request));
    if (method === "DELETE" && path === "/api/aliases") return await deleteAlias(env, signedIn, url);

    if (method === "GET" && path === "/api/account/rules") return getRules(env, signedIn);
    if (method === "POST" && path === "/api/account/rules") return await saveRules(env, signedIn, await readJson(request));
    if (method === "POST" && path === "/api/account/rules/test") return await testRules(env, signedIn, await readJson(request));
    if (method === "POST" && path === "/api/account/profile") return await saveProfile(env, signedIn, await readJson(request));
    if (method === "POST" && path === "/api/account/password") return await changePassword(env, request, signedIn, await readJson(request));
    if (method === "GET" && path === "/api/account/export") return await exportAccount(env, signedIn);
    if (method === "DELETE" && path === "/api/account") return await deleteAccount(env, request, signedIn, await readJson(request));

    if (method === "GET" && path === "/api/admin/invites") return await listInvites(env, signedIn);
    if (method === "POST" && path === "/api/admin/invites") return await createInvite(env, signedIn);
    if (method === "DELETE" && path === "/api/admin/invites") return await revokeInvite(env, signedIn, url);
    if (method === "GET" && path === "/api/admin/users") return await listUsers(env, signedIn);
    if (method === "POST" && path === "/api/admin/users/reset") return await resetUser(env, signedIn, await readJson(request));

    return error(404, "No such API");
  } catch (err) {
    if (err instanceof HttpError) return error(err.status, err.message);
    const message = err instanceof Error ? err.message : String(err);
    if (/no such table/i.test(message)) {
      return error(500, "Database is not ready. Apply the D1 migrations (see README).");
    }
    console.log(JSON.stringify({ event: "api_error", message }));
    return error(500, "Something went wrong");
  }
}

async function loadUser(env: AppEnv, request: Request): Promise<UserRow | null> {
  if (!env.SESSION_SECRET) return null;
  const token = readCookie(request.headers.get("cookie"));
  if (!token) return null;
  const session = await openSession(env.SESSION_SECRET, token);
  if (!session) return null;
  const user = await userById(env.DB, session.u);
  if (!user || user.session_version !== session.v) return null;
  return user;
}

function requireUser(user: UserRow | null): UserRow {
  if (!user) throw new HttpError(401, "Sign in required");
  return user;
}
