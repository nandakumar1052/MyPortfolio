import { Form, useNavigation } from "react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import type { Route } from "./+types/admin.experience";
import {
  deleteExperience,
  getExperience,
  upsertExperience,
} from "~/lib/db";
import { requireAdmin } from "~/lib/session.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAdmin(request, context);
  return { experience: await getExperience(context) };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireAdmin(request, context);
  const fd = await request.formData();
  const intent = String(fd.get("intent"));

  if (intent === "delete") {
    await deleteExperience(context, Number(fd.get("id")));
    return { ok: true };
  }

  await upsertExperience(context, {
    id: fd.get("id") ? Number(fd.get("id")) : undefined,
    company: String(fd.get("company") ?? ""),
    role: String(fd.get("role") ?? ""),
    location: String(fd.get("location") ?? "") || null,
    start_date: String(fd.get("start_date") ?? ""),
    end_date: String(fd.get("end_date") ?? "") || null,
    summary: String(fd.get("summary") ?? "") || null,
    highlights: splitLines(String(fd.get("highlights") ?? "")),
    technologies: splitCsv(String(fd.get("technologies") ?? "")),
    sort_order: Number(fd.get("sort_order") ?? 0),
  });

  return { ok: true };
}

function splitLines(s: string) {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
function splitCsv(s: string) {
  return s
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function AdminExperience({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Experience</h1>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Add or update each role. Highlights are one per line; technologies are
          comma-separated.
        </p>
      </header>

      <section className="space-y-4">
        {loaderData.experience.map((e) => (
          <Card key={e.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {e.role} · {e.company}
              </CardTitle>
              <Form method="post" onSubmit={(ev) => {
                if (!confirm("Delete this role?")) ev.preventDefault();
              }}>
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value={e.id} />
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
              <ExperienceForm
                defaults={{
                  id: e.id,
                  company: e.company,
                  role: e.role,
                  location: e.location ?? "",
                  start_date: e.start_date,
                  end_date: e.end_date ?? "",
                  summary: e.summary ?? "",
                  highlights: e.highlights.join("\n"),
                  technologies: e.technologies.join(", "),
                  sort_order: e.sort_order,
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
            <Plus size={18} /> Add new role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExperienceForm busy={busy} />
        </CardContent>
      </Card>
    </div>
  );
}

function ExperienceForm({
  defaults,
  busy,
}: {
  defaults?: {
    id: number;
    company: string;
    role: string;
    location: string;
    start_date: string;
    end_date: string;
    summary: string;
    highlights: string;
    technologies: string;
    sort_order: number;
  };
  busy: boolean;
}) {
  return (
    <Form method="post" className="space-y-3">
      <input type="hidden" name="intent" value="upsert" />
      {defaults && <input type="hidden" name="id" value={defaults.id} />}
      <div className="grid sm:grid-cols-2 gap-3">
        <F label="Role" name="role" defaultValue={defaults?.role} required />
        <F label="Company" name="company" defaultValue={defaults?.company} required />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <F label="Location" name="location" defaultValue={defaults?.location} />
        <F
          label="Start (YYYY-MM)"
          name="start_date"
          defaultValue={defaults?.start_date}
          placeholder="2022-10"
          required
        />
        <F
          label="End (YYYY-MM, blank = present)"
          name="end_date"
          defaultValue={defaults?.end_date}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Summary</Label>
        <Textarea name="summary" rows={2} defaultValue={defaults?.summary} />
      </div>
      <div className="space-y-1.5">
        <Label>Highlights (one per line)</Label>
        <Textarea name="highlights" rows={6} defaultValue={defaults?.highlights} required />
      </div>
      <F
        label="Technologies (comma-separated)"
        name="technologies"
        defaultValue={defaults?.technologies}
      />
      <F
        label="Sort order"
        name="sort_order"
        type="number"
        defaultValue={String(defaults?.sort_order ?? 0)}
      />
      <Button type="submit" disabled={busy} className="gap-1.5">
        <Save size={14} /> {defaults ? "Save changes" : "Add role"}
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
