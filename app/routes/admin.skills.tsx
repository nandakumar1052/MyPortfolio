import { Form, useNavigation } from "react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import type { Route } from "./+types/admin.skills";
import { deleteSkill, getSkills, queries, upsertSkill } from "~/lib/db";
import { requireAdmin } from "~/lib/session.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAdmin(request, context);
  return { skills: queries.groupSkills(await getSkills(context)) };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireAdmin(request, context);
  const fd = await request.formData();
  const intent = String(fd.get("intent"));

  if (intent === "delete") {
    await deleteSkill(context, Number(fd.get("id")));
    return { ok: true };
  }

  await upsertSkill(context, {
    id: fd.get("id") ? Number(fd.get("id")) : undefined,
    category: String(fd.get("category") ?? ""),
    name: String(fd.get("name") ?? ""),
    level: fd.get("level") ? Number(fd.get("level")) : null,
    sort_order: Number(fd.get("sort_order") ?? 0),
  });
  return { ok: true };
}

export default function AdminSkills({ loaderData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Grouped by category. Level is 1–5 (Familiar → Expert).
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-5">
        {Object.entries(loaderData.skills).map(([cat, items]) => (
          <Card key={cat}>
            <CardHeader>
              <CardTitle>{cat}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((s) => (
                <Form
                  key={s.id}
                  method="post"
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center"
                >
                  <input type="hidden" name="intent" value="upsert" />
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="category" value={s.category} />
                  <Input name="name" defaultValue={s.name} required />
                  <Input
                    name="level"
                    type="number"
                    min={1}
                    max={5}
                    className="w-16"
                    defaultValue={s.level ?? ""}
                  />
                  <Input
                    name="sort_order"
                    type="number"
                    className="w-16"
                    defaultValue={s.sort_order}
                  />
                  <div className="flex gap-1">
                    <Button type="submit" size="sm" variant="ghost" disabled={busy}>
                      <Save size={14} />
                    </Button>
                    <Form
                      method="post"
                      onSubmit={(e) => {
                        if (!confirm(`Remove ${s.name}?`)) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={s.id} />
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
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus size={18} /> Add new skill
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form
            method="post"
            className="grid sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-3 items-end"
          >
            <input type="hidden" name="intent" value="upsert" />
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input name="category" required placeholder="e.g. Backend" />
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input name="name" required placeholder="e.g. FastAPI" />
            </div>
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Input name="level" type="number" min={1} max={5} className="w-20" />
            </div>
            <div className="space-y-1.5">
              <Label>Sort</Label>
              <Input name="sort_order" type="number" defaultValue={0} className="w-20" />
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
