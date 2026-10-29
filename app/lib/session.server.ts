import { createCookieSessionStorage, redirect } from "react-router";
import type { AppLoadContext } from "react-router";
import { assertSameOrigin } from "./security.server";

type SessionData = { admin?: boolean };
type SessionFlash = { error?: string; info?: string };

function getStorage(ctx: AppLoadContext) {
  const secret = ctx.cloudflare.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add it to .dev.vars or `wrangler secret put SESSION_SECRET`.",
    );
  }
  return createCookieSessionStorage<SessionData, SessionFlash>({
    cookie: {
      name: "__nk_session",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secrets: [secret],
      secure: ctx.cloudflare.env.ENVIRONMENT !== "development",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  });
}

export async function getSession(request: Request, ctx: AppLoadContext) {
  const storage = getStorage(ctx);
  return await storage.getSession(request.headers.get("Cookie"));
}

export async function commitSession(
  session: Awaited<ReturnType<typeof getSession>>,
  ctx: AppLoadContext,
) {
  const storage = getStorage(ctx);
  return await storage.commitSession(session);
}

export async function destroySession(
  session: Awaited<ReturnType<typeof getSession>>,
  ctx: AppLoadContext,
) {
  const storage = getStorage(ctx);
  return await storage.destroySession(session);
}

export async function requireAdmin(request: Request, ctx: AppLoadContext) {
  // CSRF defense: state-changing requests must originate from the same host.
  // No-op for GET/HEAD/OPTIONS, so admin loaders are unaffected.
  assertSameOrigin(request);

  const session = await getSession(request, ctx);
  if (!session.get("admin")) {
    const url = new URL(request.url);
    throw redirect(`/admin/login?next=${encodeURIComponent(url.pathname)}`);
  }
  return session;
}

/** Constant-time string comparison. */
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function verifyAdminPassword(input: string, ctx: AppLoadContext) {
  const expected = ctx.cloudflare.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error(
      "ADMIN_PASSWORD is not set. Add it to .dev.vars or `wrangler secret put ADMIN_PASSWORD`.",
    );
  }
  return timingSafeEqual(input, expected);
}
