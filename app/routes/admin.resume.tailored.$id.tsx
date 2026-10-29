import { Form, Link, redirect, useNavigation } from "react-router";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { Route } from "./+types/admin.resume.tailored.$id";
import {
  deleteTailoredResume,
  getCertifications,
  getEducation,
  getExperience,
  getProfile,
  getSkills,
  getSocialLinks,
  getTailoredResume,
  listTailoredResumes,
  updateTailoredResumeCoverLetter,
  updateTailoredResumeMarkdown,
  type TailoredResume,
} from "~/lib/db";
import { buildResumeMarkdown } from "~/lib/resume-markdown.server";
import {
  GeminiError,
  GeminiNotConfiguredError,
  generateCoverLetter,
} from "~/lib/gemini.server";
import { requireAdmin } from "~/lib/session.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ResumePreview } from "~/components/resume-preview";
import { Badge } from "~/components/ui/badge";

export async function loader({ request, context, params }: Route.LoaderArgs) {
  await requireAdmin(request, context);
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    throw new Response("Bad tailored resume id", { status: 400 });
  }
  const [tailored, all, profile] = await Promise.all([
    getTailoredResume(context, id),
    listTailoredResumes(context),
    getProfile(context),
  ]);
  if (!tailored) {
    throw new Response("Tailored resume not found", { status: 404 });
  }
  const url = new URL(request.url);
  return {
    tailored,
    all,
    profileName: profile?.full_name ?? "Your Name",
    justCreated: url.searchParams.get("created") === "1",
    geminiConfigured: Boolean(context.cloudflare.env.GEMINI_API_KEY),
  };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  await requireAdmin(request, context);
  const id = Number(params.id);
  const fd = await request.formData();
  const intent = String(fd.get("intent"));

  if (intent === "delete") {
    await deleteTailoredResume(context, id);
    return redirect("/admin/resume/tailored");
  }

  if (intent === "save-cover") {
    const cover = String(fd.get("cover_letter") ?? "");
    await updateTailoredResumeCoverLetter(context, id, cover);
    return { ok: true as const, savedCover: true };
  }

  if (intent === "regenerate-cover") {
    const tailored = await getTailoredResume(context, id);
    if (!tailored) {
      return { ok: false as const, error: "Tailored resume not found." };
    }
    // Build the base resume markdown from current D1 so the cover letter
    // reflects today's facts, not whatever was true when the resume was first
    // tailored.
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
      return { ok: false as const, error: "Profile not found." };
    }
    const baseMarkdown = buildResumeMarkdown({
      profile,
      socials,
      experience,
      education,
      certifications,
      skills,
    });
    try {
      const cover = await generateCoverLetter(context, {
        baseMarkdown,
        jobTitle: tailored.job_title,
        company: tailored.company,
        jobDescription: tailored.job_description,
      });
      await updateTailoredResumeCoverLetter(context, id, cover);
      return { ok: true as const, regeneratedCover: true };
    } catch (err) {
      let msg = "Couldn't reach Gemini. Try again.";
      if (err instanceof GeminiNotConfiguredError) msg = err.message;
      else if (err instanceof GeminiError) msg = err.message;
      else if (err instanceof Error) msg = err.message;
      return { ok: false as const, error: msg };
    }
  }

  // intent === "save" (resume markdown)
  const md = String(fd.get("markdown") ?? "");
  await updateTailoredResumeMarkdown(context, id, md);
  return { ok: true as const };
}

export default function AdminTailoredView({ loaderData, actionData }: Route.ComponentProps) {
  const t = loaderData.tailored;
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  const [resumeDraft, setResumeDraft] = useState(t.markdown);
  const lastResumeInitial = useRef(t.markdown);
  useEffect(() => {
    if (t.markdown !== lastResumeInitial.current) {
      setResumeDraft(t.markdown);
      lastResumeInitial.current = t.markdown;
    }
  }, [t.markdown]);

  const initialCover = t.cover_letter ?? "";
  const [coverDraft, setCoverDraft] = useState(initialCover);
  const lastCoverInitial = useRef(initialCover);
  useEffect(() => {
    if (initialCover !== lastCoverInitial.current) {
      setCoverDraft(initialCover);
      lastCoverInitial.current = initialCover;
    }
  }, [initialCover]);

  const showSaveBanner =
    actionData && "ok" in actionData && actionData.ok && !loaderData.justCreated;
  const actionError =
    actionData && "ok" in actionData && !actionData.ok && "error" in actionData
      ? actionData.error
      : null;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ms-3">
          <Link to="/admin/resume/tailored">
            <ArrowLeft size={14} /> All tailored resumes
          </Link>
        </Button>

        <TailoredSwitcher all={loaderData.all} activeId={t.id} />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles size={22} /> {t.job_title}
            </h1>
            {t.company && (
              <p className="text-[var(--color-muted-foreground)] mt-1">
                {t.company}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {t.ai_model && (
                <Badge variant="outline" className="text-[10px]">
                  {t.ai_model}
                </Badge>
              )}
              <span className="text-xs text-[var(--color-muted-foreground)]">
                Created {new Date(t.created_at).toLocaleString()} · Updated{" "}
                {new Date(t.updated_at).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <a
                href={`/resume.docx?tailored=${t.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={14} /> Resume .docx
              </a>
            </Button>
            <Button asChild disabled={!t.cover_letter}>
              {t.cover_letter ? (
                <a
                  href={`/cover-letter.docx?tailored=${t.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText size={14} /> Cover letter .docx
                </a>
              ) : (
                <span>
                  <FileText size={14} /> Cover letter .docx
                </span>
              )}
            </Button>
            <Form
              method="post"
              onSubmit={(e) => {
                if (!confirm("Delete this tailored resume + cover letter?"))
                  e.preventDefault();
              }}
            >
              <input type="hidden" name="intent" value="delete" />
              <Button
                type="submit"
                variant="ghost"
                disabled={busy}
                className="text-[var(--color-destructive)]"
                aria-label="Delete"
                title="Delete"
              >
                <Trash2 size={14} />
              </Button>
            </Form>
          </div>
        </div>
      </header>

      {loaderData.justCreated && (
        <div className="flex items-start gap-2 rounded-md border border-green-300 bg-green-50 dark:bg-green-900/20 p-3">
          <CheckCircle2 className="text-green-600 mt-0.5" size={16} />
          <p className="text-sm">
            Resume{t.cover_letter ? " and cover letter" : ""} generated. Review
            below, edit if needed, then download.
          </p>
        </div>
      )}
      {showSaveBanner && (
        <div className="flex items-start gap-2 rounded-md border border-green-300 bg-green-50 dark:bg-green-900/20 p-3">
          <CheckCircle2 className="text-green-600 mt-0.5" size={16} />
          <p className="text-sm">
            {actionData && "regeneratedCover" in actionData && actionData.regeneratedCover
              ? "Cover letter regenerated from Gemini."
              : actionData && "savedCover" in actionData && actionData.savedCover
                ? "Cover letter saved."
                : "Saved."}
          </p>
        </div>
      )}
      {actionError && (
        <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 dark:bg-red-900/20 p-3">
          <AlertTriangle className="text-red-600 mt-0.5" size={16} />
          <p className="text-sm">{actionError}</p>
        </div>
      )}

      {/* RESUME card */}
      <Form method="post">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Tailored resume</CardTitle>
            <Button
              type="submit"
              name="intent"
              value="save"
              size="sm"
              disabled={busy}
              className="gap-1.5"
            >
              <Save size={14} /> {busy ? "Saving..." : "Save resume"}
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="markdown">
              <TabsList>
                <TabsTrigger value="markdown">Markdown</TabsTrigger>
                <TabsTrigger value="preview">.docx preview</TabsTrigger>
              </TabsList>
              <TabsContent value="markdown">
                <Textarea
                  name="markdown"
                  value={resumeDraft}
                  onChange={(e) => setResumeDraft(e.target.value)}
                  rows={28}
                  spellCheck={false}
                  className="font-mono text-sm leading-relaxed"
                />
              </TabsContent>
              <TabsContent value="preview">
                <input type="hidden" name="markdown" value={resumeDraft} />
                <ResumePreview markdown={resumeDraft} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </Form>

      {/* COVER LETTER card */}
      <Form method="post">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <FileText size={18} /> Cover letter
              {!t.cover_letter && (
                <Badge variant="outline" className="ml-2 text-[10px]">
                  Empty
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                type="submit"
                name="intent"
                value="regenerate-cover"
                variant="outline"
                size="sm"
                disabled={busy || !loaderData.geminiConfigured}
                className="gap-1.5"
                title={
                  loaderData.geminiConfigured
                    ? "Generate a fresh cover letter from Gemini"
                    : "Set GEMINI_API_KEY to enable regeneration"
                }
                onClick={(e) => {
                  if (
                    coverDraft.trim() &&
                    !confirm(
                      "Regenerate the cover letter from Gemini? Your current edits will be overwritten.",
                    )
                  )
                    e.preventDefault();
                }}
              >
                <RefreshCcw size={14} />
                {busy ? "Working..." : "Regenerate"}
              </Button>
              <Button
                type="submit"
                name="intent"
                value="save-cover"
                size="sm"
                disabled={busy}
                className="gap-1.5"
              >
                <Save size={14} /> Save cover letter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!t.cover_letter && !coverDraft && (
              <div className="rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-3 mb-3 flex items-start gap-2 text-sm">
                <AlertTriangle className="text-yellow-700 mt-0.5" size={16} />
                <div>
                  No cover letter saved yet. Click <strong>Regenerate</strong>{" "}
                  to have Gemini draft one from this job description, or write
                  one manually below and hit Save.
                </div>
              </div>
            )}
            <Tabs defaultValue="markdown">
              <TabsList>
                <TabsTrigger value="markdown">Editor</TabsTrigger>
                <TabsTrigger value="preview">.docx preview</TabsTrigger>
              </TabsList>
              <TabsContent value="markdown">
                <Textarea
                  name="cover_letter"
                  value={coverDraft}
                  onChange={(e) => setCoverDraft(e.target.value)}
                  rows={18}
                  spellCheck
                  className="text-sm leading-relaxed"
                  placeholder="Paragraphs of the cover letter body. The header (your name, contact, date) and salutation/sign-off are added automatically when you download as .docx."
                />
              </TabsContent>
              <TabsContent value="preview">
                <input type="hidden" name="cover_letter" value={coverDraft} />
                <CoverLetterPreview
                  profileName={loaderData.profileName}
                  body={coverDraft}
                  company={t.company}
                />
              </TabsContent>
            </Tabs>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-3">
              Write the <strong>body paragraphs only</strong>. The downloaded
              .docx wraps them in a standard letter format (your name + contact
              header, today's date, "Dear Hiring Team," and "Sincerely,").
            </p>
          </CardContent>
        </Card>
      </Form>

      {/* JOB DESCRIPTION card */}
      <Card>
        <CardHeader>
          <CardTitle>Job description used to tailor this</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans max-h-[40vh] overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-4">
            {t.job_description}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function CoverLetterPreview({
  profileName,
  company,
  body,
}: {
  profileName: string;
  company: string | null;
  body: string;
}) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const paragraphs = body
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-white text-black p-8 max-h-[60vh] overflow-auto">
      <div
        style={{ fontFamily: "Calibri, system-ui, sans-serif", fontSize: "11pt", lineHeight: 1.5 }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: "15pt", fontWeight: 700 }}>{profileName}</div>
        </div>
        <p>{today}</p>
        <br />
        <p>Hiring Team</p>
        {company && <p>{company}</p>}
        <br />
        <p>Dear Hiring Team,</p>
        {paragraphs.length === 0 ? (
          <p style={{ color: "#888", fontStyle: "italic" }}>
            (Cover letter body is empty.)
          </p>
        ) : (
          paragraphs.map((p, i) => <p key={i}>{p}</p>)
        )}
        <br />
        <p>Sincerely,</p>
        <p>{profileName}</p>
      </div>
    </div>
  );
}

function TailoredSwitcher({
  all,
  activeId,
}: {
  all: TailoredResume[];
  activeId: number;
}) {
  if (all.length <= 1) {
    // Only this one resume exists — still show the "+ New" affordance so the
    // user can spawn another from here without leaving the page.
    return (
      <nav className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Saved drafts
        </span>
        <Link
          to="/admin/resume/tailored/new"
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-[var(--color-foreground)]"
        >
          <Plus size={12} /> New tailored resume
        </Link>
      </nav>
    );
  }
  return (
    <nav className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-2">
      <p className="px-2 pt-1 pb-2 text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
        Saved drafts — click to switch
      </p>
      <div className="flex flex-wrap gap-1.5">
        {all.map((it) => {
          const active = it.id === activeId;
          return (
            <div
              key={it.id}
              className={
                active
                  ? "inline-flex items-stretch overflow-hidden rounded-md border border-[var(--color-brand-500)] bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/30 shadow-sm"
                  : "inline-flex items-stretch overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-foreground)]/30"
              }
            >
              <Link
                to={`/admin/resume/tailored/${it.id}`}
                className={
                  active
                    ? "px-3 py-1.5 text-xs font-semibold text-[var(--color-brand-800)] dark:text-[var(--color-brand-100)] max-w-[260px] truncate"
                    : "px-3 py-1.5 text-xs font-medium max-w-[260px] truncate"
                }
                title={
                  it.company
                    ? `${it.job_title} · ${it.company}`
                    : it.job_title
                }
              >
                {active && (
                  <span className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                )}
                {it.job_title}
                {it.company ? (
                  <span className="ms-1 text-[var(--color-muted-foreground)] font-normal">
                    · {it.company}
                  </span>
                ) : null}
              </Link>
              <a
                href={`/resume.docx?tailored=${it.id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Download .docx"
                aria-label={`Download .docx for ${it.job_title}`}
                className="grid place-items-center px-2 border-l border-[var(--color-border)] hover:bg-[var(--color-accent)]"
              >
                <Download size={12} />
              </a>
            </div>
          );
        })}
        <Link
          to="/admin/resume/tailored/new"
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-[var(--color-foreground)]"
        >
          <Plus size={12} /> New tailored resume
        </Link>
      </div>
    </nav>
  );
}
