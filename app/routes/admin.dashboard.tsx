import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import type { Route } from "./+types/admin.dashboard";
import {
  getCertifications,
  getContactMessages,
  getExperience,
  getProjects,
  getSkills,
} from "~/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export async function loader({ context }: Route.LoaderArgs) {
  const [experience, projects, skills, certifications, messages] =
    await Promise.all([
      getExperience(context),
      getProjects(context),
      getSkills(context),
      getCertifications(context),
      getContactMessages(context),
    ]);
  return {
    counts: {
      experience: experience.length,
      projects: projects.length,
      skills: skills.length,
      certifications: certifications.length,
    },
    unreadMessages: messages.filter((m) => !m.read).length,
    recentMessages: messages.slice(0, 5),
  };
}

export default function AdminDashboard({ loaderData }: Route.ComponentProps) {
  const { counts, unreadMessages, recentMessages } = loaderData;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Admin
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-[var(--color-muted-foreground)] mt-1">
          Quick overview of your portfolio content.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Experience entries" value={counts.experience} to="/admin/experience" />
        <StatCard label="Projects" value={counts.projects} to="/admin/projects" />
        <StatCard label="Skills" value={counts.skills} to="/admin/skills" />
        <StatCard label="Certifications" value={counts.certifications} to="/admin/certifications" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent messages</CardTitle>
          <Link
            to="/admin/messages"
            className="text-sm font-medium hover:underline inline-flex items-center gap-1"
          >
            {unreadMessages > 0 && (
              <span className="rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-2 py-0.5 text-xs">
                {unreadMessages} new
              </span>
            )}
            View all <ArrowRight size={14} />
          </Link>
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No messages yet.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {recentMessages.map((m) => (
                <li key={m.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {m.name}{" "}
                      {!m.read && (
                        <span className="ml-1 inline-block h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {m.email} · {new Date(m.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm mt-1 line-clamp-2">{m.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  to,
}: {
  label: string;
  value: number;
  to: string;
}) {
  return (
    <Link to={to} className="group">
      <Card className="transition-all group-hover:border-[var(--color-brand-500)]">
        <CardContent className="py-5">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1 group-hover:text-[var(--color-foreground)] transition-colors">
            {label}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
