import { Link, isRouteErrorResponse } from "react-router";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import type { Route } from "./+types/project.$slug";
import { getProjectBySlug } from "~/lib/db";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { mergeMeta, rootMeta } from "~/lib/meta";

export function meta({ data, matches }: Route.MetaArgs) {
  const parent = rootMeta(matches);
  if (!data) return mergeMeta(parent, [{ title: "Project not found" }]);
  const title = `${data.project.title} — Nanda Kumar`;
  return mergeMeta(parent, [
    { title },
    { name: "description", content: data.project.tagline },
    { property: "og:title", content: title },
    { property: "og:description", content: data.project.tagline },
    {
      property: "og:url",
      content: `https://nandakumaronline.com/projects/${data.project.slug}`,
    },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: data.project.tagline },
  ]);
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const project = await getProjectBySlug(context, params.slug);
  if (!project) {
    throw new Response("Project not found", { status: 404 });
  }
  return { project };
}

export default function ProjectDetail({ loaderData }: Route.ComponentProps) {
  const p = loaderData.project;
  return (
    <article className="container-tight py-16 max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="-ms-3 mb-6">
        <Link to="/projects">
          <ArrowLeft size={14} /> All projects
        </Link>
      </Button>
      <header>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {p.title}
        </h1>
        <p className="mt-3 text-xl text-[var(--color-muted-foreground)]">
          {p.tagline}
        </p>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {p.technologies.map((t) => (
            <Badge key={t} variant="soft">
              {t}
            </Badge>
          ))}
        </div>
      </header>

      <section className="mt-10 space-y-5 text-[15px] leading-relaxed">
        <h2 className="text-xl font-bold tracking-tight">Overview</h2>
        <p>{p.description}</p>
        {p.impact && (
          <>
            <h2 className="text-xl font-bold tracking-tight">Impact</h2>
            <p className="rounded-md border border-[var(--color-brand-500)]/30 bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/30 px-4 py-3">
              {p.impact}
            </p>
          </>
        )}
      </section>

      {(p.repo_url || p.demo_url) && (
        <section className="mt-10 flex gap-3">
          {p.repo_url && (
            <Button asChild variant="outline">
              <a href={p.repo_url} target="_blank" rel="noopener noreferrer">
                <Github size={14} /> View repo
              </a>
            </Button>
          )}
          {p.demo_url && (
            <Button asChild>
              <a href={p.demo_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} /> Live demo
              </a>
            </Button>
          )}
        </section>
      )}
    </article>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="container-tight py-20 text-center">
        <h1 className="text-3xl font-bold">Project not found</h1>
        <p className="mt-2 text-[var(--color-muted-foreground)]">
          That project either moved or never existed.
        </p>
        <Button asChild className="mt-6">
          <Link to="/projects">Back to projects</Link>
        </Button>
      </div>
    );
  }
  throw error;
}
