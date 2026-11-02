import { Form, useNavigation } from "react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import type { Route } from "./+types/admin.education";
import { deleteEducation, getEducation, upsertEducation } from "~/lib/db";
import { requireAdmin } from "~/lib/session.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAdmin(request, context);
  return { education: await getEducation(context) };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireAdmin(request, context);
  const fd = await request.formData();
  const intent = String(fd.get("intent"));

  if (intent === "delete") {
    await deleteEducation(context, Number(fd.get("id")));
    return { ok: true };
  }

  await upsertEducation(context, {
    id: fd.get("id") ? Number(fd.get("id")) : undefined,
    institution: String(fd.get("institution") ?? ""),
    degree: String(fd.get("degree") ?? ""),
    location: String(fd.get("location") ?? "") || null,
    start_date: String(fd.get("start_date") ?? "") || null,
    end_date: String(fd.get("end_date") ?? "") || null,
    details: String(fd.get("details") ?? "") || null,
    sort_order: Number(fd.get("sort_order") ?? 0),
  });
  return { ok: true };
}

const GRID = "grid md:grid-cols-2 gap-3 items-end";

export default function AdminEducation({ loaderData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Education</h1>
      </header>

      <div className="space-y-3">
        {loaderData.education.map((e) => (
          <Card key={e.id}>
            <CardContent className="py-4">
              <Form method="post" className={GRID}>
                <input type="hidden" name="intent" value="upsert" />
                <input type="hidden" name="id" value={e.id} />
                <div className="space-y-1.5">
                  <Label>Institution</Label>
                  <Input name="institution" defaultValue={e.institution} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Degree</Label>
                  <Input name="degree" defaultValue={e.degree} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input name="location" defaultValue={e.location ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <Label>Sort</Label>
                  <Input name="sort_order" type="number" defaultValue={e.sort_order} />
                </div>
                <div className="space-y-1.5">
                  <Label>Start</Label>
                  <Input name="start_date" placeholder="2018-06" defaultValue={e.start_date ?? ""} />
                </div>
                <div className="space-y-1.5">
                  <Label>End</Label>
                  <Input name="end_date" placeholder="2022-05" defaultValue={e.end_date ?? ""} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Details</Label>
                  <Input name="details" defaultValue={e.details ?? ""} />
                </div>
                <div className="flex gap-1">
                  <Button type="submit" size="sm" disabled={busy} className="gap-1.5">
                    <Save size={14} /> Save
                  </Button>
                  <Form
                    method="post"
                    onSubmit={(ev) => {
                      if (!confirm(`Remove ${e.institution}?`)) ev.preventDefault();
                    }}
                  >
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
                </div>
              </Form>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus size={18} /> Add education
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className={GRID}>
            <input type="hidden" name="intent" value="upsert" />
            <div className="space-y-1.5">
              <Label>Institution</Label>
              <Input name="institution" required />
            </div>
            <div className="space-y-1.5">
              <Label>Degree</Label>
              <Input name="degree" required />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input name="location" />
            </div>
            <div className="space-y-1.5">
              <Label>Sort</Label>
              <Input name="sort_order" type="number" defaultValue={0} />
            </div>
            <div className="space-y-1.5">
              <Label>Start (YYYY-MM)</Label>
              <Input name="start_date" placeholder="2018-06" />
            </div>
            <div className="space-y-1.5">
              <Label>End (YYYY-MM)</Label>
              <Input name="end_date" placeholder="2022-05" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Details</Label>
              <Input name="details" />
            </div>
            <Button type="submit" disabled={busy}>
              Add
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
