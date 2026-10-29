import { Link } from "react-router";
import { ArrowUpRight, Github, ExternalLink } from "lucide-react";
import type { Route } from "./+types/projects";
import { getProjects } from "~/lib/db";
import { mergeMeta, rootMeta } from "~/lib/meta";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function meta({ matches }: Route.MetaArgs) {
  const title = "Projects — Nanda Kumar";
  const description =
    "Selected engineering projects: GenAI assistants, real-time dashboards, automation pipelines, and internal desktop tooling.";
  return mergeMeta(rootMeta(matches), [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: "https://nandakumaronline.com/projects" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ]);
}

export async function loader({ context }: Route.LoaderArgs) {
  return { projects: await getProjects(context) };
}

export default function Projects({ loaderData }: Route.ComponentProps) {
  return (
    <div className="container-tight py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Selected work
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-1">
          Projects
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--color-muted-foreground)]">
          Production systems and internal tools. Each one is anchored to the
          metric it moved.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-5">
        {loaderData.projects.map((p) => (
          <Card key={p.id} className="group h-full">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="group-hover:text-[var(--color-primary)] transition-colors">
                    <Link
                      to={`/projects/${p.slug}`}
                      className="inline-flex items-center gap-1"
                    >
                      {p.title}
                      <ArrowUpRight
                        size={18}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </Link>
                  </CardTitle>
                  <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                    {p.tagline}
                  </p>
                </div>
                {p.featured ? (
                  <Badge variant="default">Featured</Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{p.description}</p>
              {p.impact && (
                <p className="text-sm leading-relaxed rounded-md border border-[var(--color-brand-500)]/30 bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/30 px-3 py-2">
                  <span className="font-semibold">Impact:</span> {p.impact}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {p.technologies.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
              {(p.repo_url || p.demo_url) && (
                <div className="flex gap-3 pt-1">
                  {p.repo_url && (
                    <a
                      href={p.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      <Github size={14} /> Repo
                    </a>
                  )}
                  {p.demo_url && (
                    <a
                      href={p.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      <ExternalLink size={14} /> Live
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
