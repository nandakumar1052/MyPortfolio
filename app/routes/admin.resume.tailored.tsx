import { Form, Link, useNavigation } from "react-router";
import { ArrowRight, Download, Plus, Sparkles, Trash2 } from "lucide-react";
import type { Route } from "./+types/admin.resume.tailored";
import { deleteTailoredResume, listTailoredResumes } from "~/lib/db";
import { requireAdmin } from "~/lib/session.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAdmin(request, context);
  return {
    tailored: await listTailoredResumes(context),
    geminiConfigured: Boolean(context.cloudflare.env.GEMINI_API_KEY),
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireAdmin(request, context);
  const fd = await request.formData();
  if (String(fd.get("intent")) === "delete") {
    await deleteTailoredResume(context, Number(fd.get("id")));
  }
  return { ok: true };
}

export default function AdminTailoredList({ loaderData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles size={22} /> Tailored resumes
          </h1>
          <p className="text-[var(--color-muted-foreground)] mt-1 max-w-2xl">
            Role-specific drafts generated from your base resume + a job
            description. Each one is independent — editing the base resume
            does not retroactively change a tailored copy.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/resume/tailored/new">
            <Plus size={14} /> New tailored resume
          </Link>
        </Button>
      </header>

      {!loaderData.geminiConfigured && (
        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="py-4 text-sm">
            <p className="font-semibold">Gemini API key not set.</p>
            <p className="text-[var(--color-muted-foreground)] mt-1">
              Get a free key at{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                aistudio.google.com/app/apikey
              </a>
              . Add it to <code className="font-mono text-xs">.dev.vars</code>{" "}
              as <code className="font-mono text-xs">GEMINI_API_KEY</code>{" "}
              locally, or in production run{" "}
              <code className="font-mono text-xs">
                npx wrangler secret put GEMINI_API_KEY
              </code>
              .
            </p>
          </CardContent>
        </Card>
      )}

      {loaderData.tailored.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Sparkles className="mx-auto mb-3 text-[var(--color-muted-foreground)]" />
            <p className="font-semibold">No tailored resumes yet.</p>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              Paste a job description and Gemini will draft a tailored version
              of your resume.
            </p>
            <Button asChild className="mt-5">
              <Link to="/admin/resume/tailored/new">Create your first one</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {loaderData.tailored.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-4 flex items-start justify-between gap-4">
                <Link
                  to={`/admin/resume/tailored/${t.id}`}
                  className="flex-1 hover:underline"
                >
                  <p className="font-semibold">{t.job_title}</p>
                  {t.company && (
                    <p className="text-sm text-[var(--color-muted-foreground)]">
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
                      Created {new Date(t.created_at).toLocaleString()}
                    </span>
                  </div>
                </Link>
                <div className="flex gap-1 items-center">
                  <Button asChild size="sm" variant="outline" title="Download .docx">
                    <a
                      href={`/resume.docx?tailored=${t.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download size={14} /> .docx
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/admin/resume/tailored/${t.id}`}>
                      Open <ArrowRight size={14} />
                    </Link>
                  </Button>
                  <Form
                    method="post"
                    onSubmit={(e) => {
                      if (!confirm(`Delete tailored resume for "${t.job_title}"?`))
                        e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={t.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      className="text-[var(--color-destructive)]"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </Form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
