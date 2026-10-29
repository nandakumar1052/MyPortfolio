import { Form, Link, useNavigation } from "react-router";
import { CheckCircle2, Github, Linkedin, Mail, Send } from "lucide-react";
import { useEffect } from "react";
import type { Route } from "./+types/contact";
import { getProfile, getSocialLinks, insertContactMessage } from "~/lib/db";
import { verifyTurnstile } from "~/lib/security.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { mergeMeta, rootMeta } from "~/lib/meta";

export function meta({ matches }: Route.MetaArgs) {
  const title = "Contact — Nanda Kumar";
  const description =
    "Reach out about senior software engineering roles, GenAI consulting, or collaboration.";
  return mergeMeta(rootMeta(matches), [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: "https://nandakumaronline.com/contact" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ]);
}

export async function loader({ context }: Route.LoaderArgs) {
  const [profile, socials] = await Promise.all([
    getProfile(context),
    getSocialLinks(context),
  ]);
  if (!profile) throw new Response("Profile not found", { status: 500 });
  return {
    profile,
    socials,
    turnstileSiteKey: context.cloudflare.env.TURNSTILE_SITE_KEY ?? null,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim() || null;
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim();
  const honeypot = String(formData.get("website") ?? "").trim();
  const turnstileToken =
    (formData.get("cf-turnstile-response") as string | null) ?? null;

  if (honeypot) {
    return { ok: true };
  }

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Please share your name.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Please enter a valid email.";
  if (!message || message.length < 15)
    errors.message = "A short message (at least 15 characters) helps.";

  const ip =
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For") ??
    "";

  const captcha = await verifyTurnstile(turnstileToken, context, ip || null);
  if (!captcha.ok) {
    errors.captcha = captcha.reason ?? "Captcha failed.";
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors, values: { name, email, company, subject, message } };
  }

  const ip_hash = ip ? await sha256(ip) : null;

  await insertContactMessage(context, {
    name,
    email,
    company,
    subject,
    message,
    ip_hash,
  });

  return { ok: true };
}

async function sha256(s: string) {
  const data = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function Contact({ loaderData, actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const success = actionData && "ok" in actionData && actionData.ok;
  const errors =
    actionData && "errors" in actionData ? actionData.errors : undefined;
  const values =
    actionData && "values" in actionData ? actionData.values : undefined;
  const siteKey = loaderData.turnstileSiteKey;

  // Lazy-load Cloudflare Turnstile when a site key is configured.
  useEffect(() => {
    if (!siteKey) return;
    if (document.querySelector('script[data-turnstile-loader="true"]')) return;
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true;
    s.defer = true;
    s.setAttribute("data-turnstile-loader", "true");
    document.head.appendChild(s);
  }, [siteKey]);

  return (
    <div className="container-tight py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Let's talk
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-1">
          Get in touch
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--color-muted-foreground)]">
          The fastest way to reach me. Recruiters, hiring managers, and
          collaborators all welcome.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send a message</CardTitle>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="flex items-start gap-3 rounded-md border border-green-300 bg-green-50 dark:bg-green-900/20 p-4">
                  <CheckCircle2 className="text-green-600 mt-0.5" size={20} />
                  <div>
                    <p className="font-semibold">Got it — thanks!</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      I'll reply to{" "}
                      <span className="font-mono">{loaderData.profile.email}</span>{" "}
                      within a day.
                    </p>
                  </div>
                </div>
              ) : (
                <Form method="post" className="space-y-4">
                  {/* Honeypot */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <Field
                      label="Your name"
                      name="name"
                      defaultValue={values?.name}
                      error={errors?.name}
                      required
                    />
                    <Field
                      label="Email"
                      name="email"
                      type="email"
                      defaultValue={values?.email}
                      error={errors?.email}
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field
                      label="Company"
                      name="company"
                      defaultValue={values?.company ?? ""}
                    />
                    <Field
                      label="Subject"
                      name="subject"
                      defaultValue={values?.subject ?? ""}
                      placeholder="e.g. Senior SDE role at Acme"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={6}
                      defaultValue={values?.message}
                      placeholder="Tell me a bit about the role, team, or project..."
                      required
                    />
                    {errors?.message && (
                      <p className="text-xs text-[var(--color-destructive)]">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {siteKey && (
                    <div className="space-y-1.5">
                      <div
                        className="cf-turnstile"
                        data-sitekey={siteKey}
                        data-theme="auto"
                      />
                      {errors?.captcha && (
                        <p className="text-xs text-[var(--color-destructive)]">
                          {errors.captcha}
                        </p>
                      )}
                    </div>
                  )}

                  <Button type="submit" disabled={busy} className="gap-1.5">
                    <Send size={14} />
                    {busy ? "Sending..." : "Send message"}
                  </Button>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Direct channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loaderData.socials.map((s) => {
                const k = s.label.toLowerCase();
                const Icon = k.includes("github")
                  ? Github
                  : k.includes("linkedin")
                    ? Linkedin
                    : Mail;
                return (
                  <Link
                    key={s.id}
                    to={s.url}
                    className="flex items-center gap-3 rounded-md border border-[var(--color-border)] px-3 py-2.5 hover:bg-[var(--color-accent)]"
                  >
                    <Icon size={16} />
                    <div>
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] truncate max-w-[16rem]">
                        {s.url.replace(/^https?:\/\//, "")}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                I typically reply within 24 hours, Monday through Friday IST.
                For time-sensitive opportunities, please mention the deadline in
                the subject.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
      />
      {error && (
        <p className="text-xs text-[var(--color-destructive)]">{error}</p>
      )}
    </div>
  );
}
