import type { AppLoadContext } from "react-router";

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
//
// Applied to every response by workers/app.ts. The CSP allows what this app
// actually uses: self, Google Fonts, and Cloudflare Turnstile. Inline scripts
// and styles are allowed because React Router emits inline hydration data and
// we use inline <style> blocks (e.g. the print stylesheet on /resume).
// Trade-off accepted for a personal portfolio. If you ever embed third-party
// scripts, prefer adding their exact origins rather than widening to 'unsafe-*'.

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

export function applySecurityHeaders(response: Response, env: Env) {
  const h = response.headers;
  h.set("Content-Security-Policy", CSP_DIRECTIVES);
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "DENY");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  h.set("Cross-Origin-Opener-Policy", "same-origin");
  // HSTS only in production. Locally we serve over http://localhost.
  if (env.ENVIRONMENT !== "development") {
    h.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return response;
}

// ---------------------------------------------------------------------------
// Same-origin (CSRF) check
// ---------------------------------------------------------------------------
//
// SameSite=Lax on the session cookie already blocks cross-site POSTs.
// This is defense-in-depth: every state-changing admin request must originate
// from the same host. Catches edge cases like shared parent-domain attacks
// on workers.dev.

export function assertSameOrigin(request: Request) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;

  const url = new URL(request.url);
  const origin = request.headers.get("Origin");
  const referer = request.headers.get("Referer");

  // Prefer Origin (more strictly set by browsers on POST). Fall back to Referer.
  const sourceOrigin = origin ?? (referer ? safeOrigin(referer) : null);
  if (!sourceOrigin) {
    throw new Response("Missing Origin/Referer header", { status: 403 });
  }
  if (sourceOrigin !== url.origin) {
    throw new Response("Cross-origin request refused", { status: 403 });
  }
}

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Login attempt limiter (per IP, in-memory)
// ---------------------------------------------------------------------------
//
// Defense-in-depth against brute force on /admin/login. State lives in the
// running Worker instance — it does NOT survive Worker recycling. Pair with a
// Cloudflare Rate Limiting rule on /admin/login for durable protection.

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAILS = 5;

type Bucket = { count: number; firstAt: number };
const buckets = new Map<string, Bucket>();

function bucketKey(request: Request) {
  return (
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export function checkLoginRate(request: Request): { blocked: boolean; retryAfter: number } {
  const key = bucketKey(request);
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.firstAt > WINDOW_MS) {
    return { blocked: false, retryAfter: 0 };
  }
  if (b.count >= MAX_FAILS) {
    return {
      blocked: true,
      retryAfter: Math.ceil((WINDOW_MS - (now - b.firstAt)) / 1000),
    };
  }
  return { blocked: false, retryAfter: 0 };
}

export function recordLoginFailure(request: Request) {
  const key = bucketKey(request);
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.firstAt > WINDOW_MS) {
    buckets.set(key, { count: 1, firstAt: now });
  } else {
    b.count += 1;
  }
}

export function clearLoginFailures(request: Request) {
  buckets.delete(bucketKey(request));
}

// ---------------------------------------------------------------------------
// Cloudflare Turnstile verification
// ---------------------------------------------------------------------------
//
// If TURNSTILE_SECRET_KEY is not set, verification is skipped — useful in dev
// before you wire real keys. In production you should set both
// TURNSTILE_SITE_KEY (public, surfaced to the client) and TURNSTILE_SECRET_KEY
// (secret, via `wrangler secret put TURNSTILE_SECRET_KEY`).

export async function verifyTurnstile(
  token: string | null,
  ctx: AppLoadContext,
  remoteIp: string | null,
): Promise<{ ok: boolean; reason?: string }> {
  const secret = ctx.cloudflare.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true }; // turnstile disabled
  if (!token) return { ok: false, reason: "Captcha missing." };

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    if (!data.success) {
      return {
        ok: false,
        reason: `Captcha failed (${data["error-codes"]?.join(",") ?? "unknown"}).`,
      };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: "Captcha verification unreachable." };
  }
}
