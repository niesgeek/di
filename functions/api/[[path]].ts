import { handleRequest } from "../../src/router";
import type { AppEnv, WaitCtx } from "../../src/types";

// Pages Functions entry. `wrangler dev` / `wrangler deploy` use src/index.ts instead.
export const onRequest = (context: EventContext<AppEnv, string, unknown> & WaitCtx) => {
  return handleRequest(context.request, context.env, context);
};
