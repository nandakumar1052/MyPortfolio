import { Form, useNavigation } from "react-router";
import { Check, MailOpen, Trash2 } from "lucide-react";
import type { Route } from "./+types/admin.messages";
import {
  deleteMessage,
  getContactMessages,
  markMessageRead,
} from "~/lib/db";
import { requireAdmin } from "~/lib/session.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAdmin(request, context);
  return { messages: await getContactMessages(context) };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireAdmin(request, context);
  const fd = await request.formData();
  const id = Number(fd.get("id"));
  const intent = String(fd.get("intent"));

  if (intent === "delete") await deleteMessage(context, id);
  if (intent === "read") await markMessageRead(context, id, true);
  if (intent === "unread") await markMessageRead(context, id, false);

  return { ok: true };
}

export default function AdminMessages({ loaderData }: Route.ComponentProps) {
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Messages from the contact form.
        </p>
      </header>

      {loaderData.messages.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          No messages yet.
        </p>
      ) : (
        <div className="space-y-3">
          {loaderData.messages.map((m) => (
            <Card key={m.id} className={m.read ? "opacity-70" : ""}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{m.name}</p>
                      {!m.read && (
                        <span className="rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-2 py-0.5 text-[10px] uppercase tracking-wider">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      <a href={`mailto:${m.email}`} className="underline">
                        {m.email}
                      </a>
                      {m.company ? ` · ${m.company}` : ""} ·{" "}
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                    {m.subject && (
                      <p className="text-sm font-medium mt-2">{m.subject}</p>
                    )}
                    <p className="text-sm mt-1 whitespace-pre-wrap">{m.message}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Form method="post">
                      <input
                        type="hidden"
                        name="intent"
                        value={m.read ? "unread" : "read"}
                      />
                      <input type="hidden" name="id" value={m.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        title={m.read ? "Mark unread" : "Mark read"}
                      >
                        {m.read ? <MailOpen size={14} /> : <Check size={14} />}
                      </Button>
                    </Form>
                    <Form
                      method="post"
                      onSubmit={(e) => {
                        if (!confirm("Delete this message?")) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={m.id} />
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
