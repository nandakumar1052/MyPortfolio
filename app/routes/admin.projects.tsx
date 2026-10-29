import { Form, useNavigation } from "react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import type { Route } from "./+types/admin.projects";
import {
  deleteProject,
  getProjects,
  upsertProject,
} from "~/lib/db";
import { requireAdmin } from "~/lib/session.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAdmin(request, context);
  return { projects: await getProjects(context) };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireAdmin(request, context);
  const fd = await request.formData();
  const intent = String(fd.get("intent"));

  if (intent === "delete") {
    await deleteProject(context, Number(fd.get("id")));
    return { ok: true };
  }

  await upsertProject(context, {
    id: fd.get("id") ? Number(fd.get("id")) : undefined,
    title: String(fd.get("title") ?? ""),
    slug: String(fd.get("slug") ?? "").toLowerCase().replace(/\s+/g, "-"),
    tagline: String(fd.get("tagline") ?? ""),
    description: String(fd.get("description") ?? ""),
    impact: String(fd.get("impact") ?? "") || null,
    technologies: String(fd.get("technologies") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    repo_url: String(fd.get("repo_url") ?? "") || null,
    demo_url: String(fd.get("demo_url") ?? "") || null,
    featured: fd.get("featured") === "on" ? 1 : 0,
    sort_order: Number(fd.get("sort_order") ?? 0),
  });
  return { ok: true };
}

export default function AdminProjects({ loaderData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Showcase work. Mark the strongest ones as Featured to surface on the
          home page.
        </p>
      </header>

      <section className="space-y-4">
        {loaderData.projects.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{p.title}</CardTitle>
              <Form
                method="post"
                onSubmit={(e) => {
                  if (!confirm("Delete this project?")) e.preventDefault();
                }}
              >
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={p.id} />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="text-[var(--color-destructive)]"
                >
                  <Trash2 size={14} />
                </Button>
              </Form>
            </CardHeader>
            <CardContent>
              <ProjectForm
                defaults={{
                  id: p.id,
                  title: p.title,
                  slug: p.slug,
                  tagline: p.tagline,
                  description: p.description,
                  impact: p.impact ?? "",
                  technologies: p.technologies.join(", "),
                  repo_url: p.repo_url ?? "",
                  demo_url: p.demo_url ?? "",
                  featured: !!p.featured,
                  sort_order: p.sort_order,
                }}
                busy={busy}
              />
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus size={18} /> Add new project
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm busy={busy} />
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectForm({
  defaults,
  busy,
}: {
  defaults?: {
    id: number;
    title: string;
    slug: string;
    tagline: string;
    description: string;
    impact: string;
    technologies: string;
    repo_url: string;
    demo_url: string;
    featured: boolean;
    sort_order: number;
  };
  busy: boolean;
}) {
  return (
    <Form method="post" className="space-y-3">
      <input type="hidden" name="intent" value="upsert" />
      {defaults && <input type="hidden" name="id" value={defaults.id} />}
      <div className="grid sm:grid-cols-2 gap-3">
        <F label="Title" name="title" defaultValue={defaults?.title} required />
        <F
          label="Slug"
          name="slug"
          defaultValue={defaults?.slug}
          placeholder="my-project-name"
          required
        />
      </div>
      <F label="Tagline" name="tagline" defaultValue={defaults?.tagline} required />
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          name="description"
          rows={4}
          defaultValue={defaults?.description}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Impact (the metric it moved)</Label>
        <Textarea name="impact" rows={2} defaultValue={defaults?.impact} />
      </div>
      <F
        label="Technologies (comma-separated)"
        name="technologies"
        defaultValue={defaults?.technologies}
        required
      />
      <div className="grid sm:grid-cols-2 gap-3">
        <F label="Repo URL" name="repo_url" defaultValue={defaults?.repo_url} />
        <F label="Demo URL" name="demo_url" defaultValue={defaults?.demo_url} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3 items-end">
        <F
          label="Sort order"
          name="sort_order"
          type="number"
          defaultValue={String(defaults?.sort_order ?? 0)}
        />
        <label className="flex items-center gap-2 text-sm h-10">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={defaults?.featured}
            className="h-4 w-4 rounded border-[var(--color-border)]"
          />
          Featured on home page
        </label>
      </div>
      <Button type="submit" disabled={busy} className="gap-1.5">
        <Save size={14} /> {defaults ? "Save changes" : "Add project"}
      </Button>
    </Form>
  );
}

function F({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
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
    </div>
  );
}
