import { Form, Link, useNavigation } from "react-router";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCcw,
  Save,
  Sparkles,
} from "lucide-react";
import type { Route } from "./+types/admin.resume";
import {
  getCertifications,
  getEducation,
  getExperience,
  getProfile,
  getSkills,
  getSocialLinks,
  replaceAllCertifications,
  replaceAllSkills,
  upsertExperience,
  upsertProfile,
} from "~/lib/db";
import {
  buildResumeMarkdown,
  parseResumeMarkdown,
} from "~/lib/resume-markdown.server";
import { requireAdmin } from "~/lib/session.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ResumePreview } from "~/components/resume-preview";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAdmin(request, context);
  const [profile, socials, experience, education, certifications, skills] =
    await Promise.all([
      getProfile(context),
      getSocialLinks(context),
      getExperience(context),
      getEducation(context),
      getCertifications(context),
      getSkills(context),
    ]);
  if (!profile) throw new Response("Profile not found", { status: 500 });

  const markdown = buildResumeMarkdown({
    profile,
    socials,
    experience,
    education,
    certifications,
    skills,
  });
  return { markdown };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireAdmin(request, context);
  const fd = await request.formData();
  const intent = String(fd.get("intent"));

  async function freshMarkdown() {
    const [profile, socials, experience, education, certifications, skills] =
      await Promise.all([
        getProfile(context),
        getSocialLinks(context),
        getExperience(context),
        getEducation(context),
        getCertifications(context),
        getSkills(context),
      ]);
    if (!profile) throw new Response("Profile not found", { status: 500 });
    return buildResumeMarkdown({
      profile,
      socials,
      experience,
      education,
      certifications,
      skills,
    });
  }

  if (intent === "reset") {
    return {
      ok: true as const,
      reset: true,
      markdown: await freshMarkdown(),
      warnings: [] as string[],
      applied: {
        summary: false,
        highlights: false,
        skills: false,
        certifications: false,
      },
    };
  }

  // intent === "save"
  const md = String(fd.get("markdown") ?? "");
  const parsed = parseResumeMarkdown(md);

  if (parsed.summary !== undefined) {
    const current = await getProfile(context);
    if (current) {
      await upsertProfile(context, {
        full_name: current.full_name,
        title: current.title,
        tagline: current.tagline,
        summary: parsed.summary,
        location: current.location,
        email: current.email,
        phone: current.phone,
        available: current.available,
        years_experience: current.years_experience,
      });
    }
  }
  if (parsed.experienceHighlights) {
    const experiences = await getExperience(context);
    for (const [idx, bullets] of parsed.experienceHighlights) {
      const target = experiences[idx];
      if (!target) {
        parsed.warnings.push(
          `Markdown has a job at position #${idx + 1} but the database only has ${experiences.length} role(s). Extra ones skipped.`,
        );
        continue;
      }
      await upsertExperience(context, {
        id: target.id,
        company: target.company,
        role: target.role,
        location: target.location,
        start_date: target.start_date,
        end_date: target.end_date,
        summary: target.summary,
        highlights: bullets,
        technologies: target.technologies,
        sort_order: target.sort_order,
      });
    }
  }
  if (parsed.skills) await replaceAllSkills(context, parsed.skills);
  if (parsed.certifications)
    await replaceAllCertifications(context, parsed.certifications);

  return {
    ok: true as const,
    reset: false,
    markdown: await freshMarkdown(),
    warnings: parsed.warnings,
    applied: parsed.changed,
  };
}

export default function AdminResume({ loaderData, actionData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";
  const serverMd = actionData?.markdown ?? loaderData.markdown;

  // Live local copy of the markdown so the preview tab updates as you type
  // without needing to submit. Re-sync when the server returns fresh markdown.
  const [draft, setDraft] = useState(serverMd);
  const lastServerMd = useRef(serverMd);
  useEffect(() => {
    if (serverMd !== lastServerMd.current) {
      setDraft(serverMd);
      lastServerMd.current = serverMd;
    }
  }, [serverMd]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resume</h1>
          <p className="text-[var(--color-muted-foreground)] mt-1 max-w-2xl">
            Edit your resume as markdown on the left tab, see the formatted
            output (matches the .docx) on the right tab. Saving parses your
            changes back to the database — your website and the live{" "}
            <code className="font-mono text-xs">/resume.docx</code> download
            stay in sync.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/resume/tailored">
              <Sparkles size={14} /> Tailored versions
            </Link>
          </Button>
          <Button asChild>
            <a href="/resume.docx" target="_blank" rel="noopener noreferrer">
              <Download size={14} /> Download .docx
            </a>
          </Button>
        </div>
      </header>

      {actionData?.ok && !actionData.reset && (
        <SaveSummary
          applied={actionData.applied}
          warnings={actionData.warnings}
        />
      )}
      {actionData?.ok && actionData.reset && (
        <div className="flex items-start gap-2 rounded-md border border-blue-300 bg-blue-50 dark:bg-blue-900/20 p-3">
          <RefreshCcw className="text-blue-600 mt-0.5" size={16} />
          <p className="text-sm">
            Editor reset to the live state from the database.
          </p>
        </div>
      )}

      <Form method="post">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Editor</CardTitle>
            <div className="flex gap-2">
              <Button
                type="submit"
                name="intent"
                value="reset"
                variant="outline"
                size="sm"
                disabled={busy}
                className="gap-1.5"
              >
                <RefreshCcw size={14} /> Reset from DB
              </Button>
              <Button
                type="submit"
                name="intent"
                value="save"
                size="sm"
                disabled={busy}
                className="gap-1.5"
              >
                <Save size={14} /> {busy ? "Saving..." : "Save & sync to DB"}
              </Button>
            </div>
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
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={32}
                  spellCheck={false}
                  className="font-mono text-sm leading-relaxed"
                />
              </TabsContent>

              <TabsContent value="preview">
                {/* The textarea above is the form field; mirror it here as hidden so the
                    form still submits even when this tab is active. */}
                <input type="hidden" name="markdown" value={draft} />
                <ResumePreview markdown={draft} />
              </TabsContent>
            </Tabs>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-3">
              <strong>What gets saved back to the database:</strong>{" "}
              Professional Summary, all jobs' bullets (positionally — the Nth{" "}
              <code className="font-mono text-[11px]">### Role — Company</code>{" "}
              heading maps to the Nth experience by sort order), Technical
              Skills, Certifications. Other sections (full experience header
              fields, education, awards) are rendered from the database — edit
              those on their dedicated admin pages.
            </p>
          </CardContent>
        </Card>
      </Form>
    </div>
  );
}

function SaveSummary({
  applied,
  warnings,
}: {
  applied: {
    summary: boolean;
    highlights: boolean;
    skills: boolean;
    certifications: boolean;
  };
  warnings: string[];
}) {
  const labels: Array<[keyof typeof applied, string]> = [
    ["summary", "Professional Summary"],
    ["highlights", "Experience bullets"],
    ["skills", "Technical Skills"],
    ["certifications", "Certifications"],
  ];
  const updated = labels.filter(([k]) => applied[k]).map(([, l]) => l);

  return (
    <div className="space-y-2">
      {updated.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-green-300 bg-green-50 dark:bg-green-900/20 p-3">
          <CheckCircle2 className="text-green-600 mt-0.5" size={16} />
          <div>
            <p className="text-sm font-semibold">Saved to database</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Updated: {updated.join(", ")}.
            </p>
          </div>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-3">
          <AlertTriangle className="text-yellow-700 mt-0.5" size={16} />
          <div>
            <p className="text-sm font-semibold">Heads up</p>
            <ul className="mt-1 list-disc ms-5 text-sm space-y-0.5">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {updated.length === 0 && warnings.length === 0 && (
        <div className="flex items-start gap-2 rounded-md border border-[var(--color-border)] p-3 text-sm">
          No structured changes detected — your markdown matches the database.
        </div>
      )}
    </div>
  );
}
