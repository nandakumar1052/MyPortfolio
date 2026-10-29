import { Form, useNavigation } from "react-router";
import { Plus, Save, Trash2 } from "lucide-react";
import type { Route } from "./+types/admin.certifications";
import {
  deleteCertification,
  getCertifications,
  upsertCertification,
} from "~/lib/db";
import { requireAdmin } from "~/lib/session.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAdmin(request, context);
  return { certifications: await getCertifications(context) };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireAdmin(request, context);
  const fd = await request.formData();
  const intent = String(fd.get("intent"));

  if (intent === "delete") {
    await deleteCertification(context, Number(fd.get("id")));
    return { ok: true };
  }

  await upsertCertification(context, {
    id: fd.get("id") ? Number(fd.get("id")) : undefined,
    name: String(fd.get("name") ?? ""),
    issuer: String(fd.get("issuer") ?? ""),
    issued_date: String(fd.get("issued_date") ?? ""),
    credential_id: String(fd.get("credential_id") ?? "") || null,
    url: String(fd.get("url") ?? "") || null,
    sort_order: Number(fd.get("sort_order") ?? 0),
  });
  return { ok: true };
}

export default function AdminCertifications({
  loaderData,
}: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Certifications</h1>
      </header>

      <div className="space-y-3">
        {loaderData.certifications.map((c) => (
          <Card key={c.id}>
            <CardContent className="py-4">
              <Form
                method="post"
                className="grid md:grid-cols-[2fr_1fr_120px_120px_auto] gap-3 items-end"
              >
                <input type="hidden" name="intent" value="upsert" />
                <input type="hidden" name="id" value={c.id} />
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input name="name" defaultValue={c.name} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Issuer</Label>
                  <Input name="issuer" defaultValue={c.issuer} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Issued</Label>
                  <Input
                    name="issued_date"
                    placeholder="2024-09"
                    defaultValue={c.issued_date}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Sort</Label>
                  <Input
                    name="sort_order"
                    type="number"
                    defaultValue={c.sort_order}
                  />
                </div>
                <div className="flex gap-1">
                  <Button type="submit" size="sm" disabled={busy} className="gap-1.5">
                    <Save size={14} /> Save
                  </Button>
                  <Form
                    method="post"
                    onSubmit={(e) => {
                      if (!confirm(`Remove ${c.name}?`)) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={c.id} />
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
            <Plus size={18} /> Add certification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form
            method="post"
            className="grid md:grid-cols-[2fr_1fr_120px_120px_auto] gap-3 items-end"
          >
            <input type="hidden" name="intent" value="upsert" />
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label>Issuer</Label>
              <Input name="issuer" required />
            </div>
            <div className="space-y-1.5">
              <Label>Issued (YYYY-MM)</Label>
              <Input name="issued_date" required placeholder="2025-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Sort</Label>
              <Input name="sort_order" type="number" defaultValue={0} />
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
