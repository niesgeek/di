import { handleRequest } from "./router";
import type { WorkerEnv } from "./types";

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return handleRequest(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<WorkerEnv>;
