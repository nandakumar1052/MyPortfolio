import { NavLink, Outlet, Form } from "react-router";
import {
  Briefcase,
  FileText,
  Folder,
  Inbox,
  LayoutDashboard,
  LogOut,
  Sparkles,
  User2,
  Wand2,
  Wrench,
} from "lucide-react";
import type { Route } from "./+types/admin";
import { requireAdmin } from "~/lib/session.server";
import { getProfile } from "~/lib/db";
import { cn } from "~/lib/utils";

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAdmin(request, context);
  return { profile: await getProfile(context) };
}

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/profile", label: "Profile", icon: User2 },
  { to: "/admin/experience", label: "Experience", icon: Briefcase },
  { to: "/admin/projects", label: "Projects", icon: Folder },
  { to: "/admin/skills", label: "Skills", icon: Wrench },
  { to: "/admin/certifications", label: "Certifications", icon: Sparkles },
  { to: "/admin/resume", label: "Resume (markdown)", icon: FileText },
  { to: "/admin/resume/tailored", label: "Tailored (AI)", icon: Wand2 },
  { to: "/admin/messages", label: "Messages", icon: Inbox },
];

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen grid md:grid-cols-[240px_1fr]">
      <aside className="border-b md:border-b-0 md:border-r border-[var(--color-border)] bg-[var(--color-card)] flex flex-col">
        <div className="p-5 border-b border-[var(--color-border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            Admin
          </p>
          <p className="font-bold tracking-tight mt-1">
            {loaderData.profile?.full_name ?? "Portfolio"}
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-x-auto md:overflow-x-visible flex md:flex-col">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
                )
              }
            >
              <l.icon size={16} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--color-border)]">
          <Form method="post" action="/admin/logout">
            <button
              type="submit"
              className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            >
              <LogOut size={16} /> Sign out
            </button>
          </Form>
        </div>
      </aside>

      <main className="p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
