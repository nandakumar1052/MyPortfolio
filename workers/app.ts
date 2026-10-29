import { createRequestHandler } from "react-router";
import { applySecurityHeaders } from "../app/lib/security.server";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const response = await requestHandler(request, {
      cloudflare: { env, ctx },
    });
    return applySecurityHeaders(response, env);
  },
} satisfies ExportedHandler<Env>;
