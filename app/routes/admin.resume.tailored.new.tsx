import { Form, redirect, useNavigation } from "react-router";
import { AlertTriangle, ArrowLeft, Sparkles } from "lucide-react";
import type { Route } from "./+types/admin.resume.tailored.new";
import {
  createTailoredResume,
  getCertifications,
  getEducation,
  getExperience,
  getProfile,
  getSkills,
  getSocialLinks,
} from "~/lib/db";
import { buildResumeMarkdown } from "~/lib/resume-markdown.server";
import {
  GeminiError,
  GeminiNotConfiguredError,
  generateCoverLetter,
  tailorResumeMarkdown,
} from "~/lib/gemini.server";
import { requireAdmin } from "~/lib/session.server";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAdmin(request, context);
  return {
    geminiConfigured: Boolean(context.cloudflare.env.GEMINI_API_KEY),
    model: context.cloudflare.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireAdmin(request, context);
  const fd = await request.formData();
  const job_title = String(fd.get("job_title") ?? "").trim();
  const company = String(fd.get("company") ?? "").trim() || null;
  const jd = String(fd.get("job_description") ?? "").trim();

  const errors: Record<string, string> = {};
  if (!job_title) errors.job_title = "Job title is required.";
  if (jd.length < 80)
    errors.job_description =
      "Paste a real job description — at least 80 characters helps the model.";

  if (Object.keys(errors).length) {
    return { ok: false as const, errors, values: { job_title, company: company ?? "", job_description: jd } };
  }

  // Build the base resume markdown from D1.
  const [profile, socials, experience, education, certifications, skills] =
    await Promise.all([
      getProfile(context),
      getSocialLinks(context),
      getExperience(context),
      getEducation(context),
      getCertifications(context),
      getSkills(context),
    ]);
  if (!profile) {
    return {
      ok: false as const,
      errors: { _form: "Profile not found in database." },
      values: { job_title, company: company ?? "", job_description: jd },
    };
  }
  const baseMarkdown = buildResumeMarkdown({
    profile,
    socials,
    experience,
    education,
    certifications,
    skills,
  });

  // Two parallel Gemini calls — resume tailor + cover letter — so the user
  // gets both with one click. If the cover letter call fails, we still save
  // the tailored resume; the user can regenerate the cover letter later.
  let tailored: string;
  let coverLetter: string | null = null;
  try {
    const [resumeRes, coverRes] = await Promise.allSettled([
      tailorResumeMarkdown(context, {
        baseMarkdown,
        jobTitle: job_title,
        company,
        jobDescription: jd,
      }),
      generateCoverLetter(context, {
        baseMarkdown,
        jobTitle: job_title,
        company,
        jobDescription: jd,
      }),
    ]);
    if (resumeRes.status === "rejected") throw resumeRes.reason;
    tailored = resumeRes.value;
    if (coverRes.status === "fulfilled") coverLetter = coverRes.value;
    else console.error("Cover letter generation failed:", coverRes.reason);
  } catch (err) {
    let msg = "Couldn't reach Gemini. Try again.";
    if (err instanceof GeminiNotConfiguredError) msg = err.message;
    else if (err instanceof GeminiError) msg = err.message;
    else if (err instanceof Error) msg = err.message;
    return {
      ok: false as const,
      errors: { _form: msg },
      values: { job_title, company: company ?? "", job_description: jd },
    };
  }

  const id = await createTailoredResume(context, {
    job_title,
    company,
    job_description: jd,
    markdown: tailored,
    cover_letter: coverLetter,
    ai_model: context.cloudflare.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  });

  return redirect(`/admin/resume/tailored/${id}?created=1`);
}

export default function AdminTailoredNew({ loaderData, actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";
  const errors = actionData && "errors" in actionData ? actionData.errors : undefined;
  const values = actionData && "values" in actionData ? actionData.values : undefined;

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <Button asChild variant="ghost" size="sm" className="-ms-3 mb-3">
          <Link to="/admin/resume/tailored">
            <ArrowLeft size={14} /> All tailored resumes
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles size={22} /> Tailor for a role
        </h1>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Paste a job description below. Gemini will produce a tailored markdown
          resume that reorders and rephrases your existing content for this
          specific role. No fabrication — only what's already in your base
          resume.
        </p>
      </header>

      {!loaderData.geminiConfigured && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-3 flex items-start gap-2">
          <AlertTriangle className="text-yellow-700 mt-0.5" size={16} />
          <p className="text-sm">
            <strong>Gemini API key not configured.</strong> Submitting this
            form will return an error until you set{" "}
            <code className="font-mono text-xs">GEMINI_API_KEY</code>.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>New tailored resume</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="job_title">Job title *</Label>
                <Input
                  id="job_title"
                  name="job_title"
                  required
                  defaultValue={values?.job_title}
                  placeholder="e.g. Senior Backend Engineer"
                />
                {errors?.job_title && (
                  <p className="text-xs text-[var(--color-destructive)]">
                    {errors.job_title}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  defaultValue={values?.company}
                  placeholder="e.g. Acme Corp"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job_description">Job description *</Label>
              <Textarea
                id="job_description"
                name="job_description"
                required
                rows={14}
                defaultValue={values?.job_description}
                placeholder="Paste the full JD here — responsibilities, requirements, tech stack..."
              />
              {errors?.job_description && (
                <p className="text-xs text-[var(--color-destructive)]">
                  {errors.job_description}
                </p>
              )}
            </div>

            {errors?._form && (
              <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-900/20 p-3 text-sm">
                {errors._form}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={busy || !loaderData.geminiConfigured}
                className="gap-1.5"
              >
                <Sparkles size={14} />
                {busy ? "Tailoring..." : "Generate tailored resume"}
              </Button>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                Model: {loaderData.model}
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              The model is instructed not to invent facts. You can edit the
              result on the next page before downloading.
            </p>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
