import { Form, useNavigation } from "react-router";
import { Save } from "lucide-react";
import type { Route } from "./+types/admin.profile";
import { getProfile, upsertProfile } from "~/lib/db";
import { requireAdmin } from "~/lib/session.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAdmin(request, context);
  return { profile: await getProfile(context) };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireAdmin(request, context);
  const fd = await request.formData();
  await upsertProfile(context, {
    full_name: String(fd.get("full_name") ?? ""),
    title: String(fd.get("title") ?? ""),
    tagline: String(fd.get("tagline") ?? ""),
    summary: String(fd.get("summary") ?? ""),
    location: String(fd.get("location") ?? ""),
    email: String(fd.get("email") ?? ""),
    phone: String(fd.get("phone") ?? "") || null,
    available: fd.get("available") === "on" ? 1 : 0,
    years_experience: Number(fd.get("years_experience") ?? 0),
  });
  return { saved: true };
}

export default function AdminProfile({ loaderData, actionData }: Route.ComponentProps) {
  const p = loaderData.profile;
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          The headline data shown across the entire site.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <Row>
              <Field label="Full name" name="full_name" defaultValue={p?.full_name} required />
              <Field label="Headline / title" name="title" defaultValue={p?.title} required />
            </Row>
            <Field label="Tagline" name="tagline" defaultValue={p?.tagline} required />
            <div className="space-y-1.5">
              <Label htmlFor="summary">Summary</Label>
              <Textarea id="summary" name="summary" rows={5} defaultValue={p?.summary} required />
            </div>
            <Row>
              <Field label="Location" name="location" defaultValue={p?.location} required />
              <Field label="Email" name="email" type="email" defaultValue={p?.email} required />
            </Row>
            <Row>
              <Field label="Phone" name="phone" defaultValue={p?.phone ?? ""} />
              <Field
                label="Years of experience"
                name="years_experience"
                type="number"
                defaultValue={String(p?.years_experience ?? 0)}
              />
            </Row>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="available"
                defaultChecked={!!p?.available}
                className="h-4 w-4 rounded border-[var(--color-border)]"
              />
              Open to opportunities (shown in the hero badge)
            </label>
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={busy} className="gap-1.5">
                <Save size={14} /> {busy ? "Saving..." : "Save changes"}
              </Button>
              {actionData?.saved && (
                <span className="text-sm text-green-600">Saved ✓</span>
              )}
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
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
        required={required}
      />
    </div>
  );
}
