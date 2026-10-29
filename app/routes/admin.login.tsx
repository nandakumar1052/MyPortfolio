import { Form, redirect, useNavigation } from "react-router";
import { LockKeyhole } from "lucide-react";
import type { Route } from "./+types/admin.login";
import {
  commitSession,
  getSession,
  verifyAdminPassword,
} from "~/lib/session.server";
import {
  assertSameOrigin,
  checkLoginRate,
  clearLoginFailures,
  recordLoginFailure,
} from "~/lib/security.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function meta() {
  return [{ title: "Admin sign-in" }, { name: "robots", content: "noindex" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const session = await getSession(request, context);
  if (session.get("admin")) {
    return redirect("/admin");
  }
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  assertSameOrigin(request);

  const rate = checkLoginRate(request);
  if (rate.blocked) {
    throw new Response(
      `Too many failed attempts. Try again in ${rate.retryAfter}s.`,
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      },
    );
  }

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!verifyAdminPassword(password, context)) {
    recordLoginFailure(request);
    return { error: "Wrong password." };
  }

  clearLoginFailures(request);

  const session = await getSession(request, context);
  session.set("admin", true);

  return redirect(next.startsWith("/admin") ? next : "/admin", {
    headers: { "Set-Cookie": await commitSession(session, context) },
  });
}

export default function AdminLogin({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const url = typeof window !== "undefined" ? new URL(window.location.href) : null;
  const next = url?.searchParams.get("next") ?? "/admin";

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-brand-100)] text-[var(--color-brand-700)] dark:bg-[var(--color-brand-900)] dark:text-[var(--color-brand-200)]">
            <LockKeyhole size={18} />
          </div>
          <CardTitle className="pt-2">Admin sign-in</CardTitle>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Restricted area. Enter the admin password to edit portfolio content.
          </p>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
              />
            </div>
            {actionData && typeof actionData === "object" && "error" in actionData && (
              <p className="text-sm text-[var(--color-destructive)]">
                {String(actionData.error)}
              </p>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Signing in..." : "Sign in"}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
