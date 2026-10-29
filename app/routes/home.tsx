import { Link } from "react-router";
import {
  ArrowRight,
  Bot,
  Cpu,
  Database,
  Github,
  Linkedin,
  Mail,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import type { Route } from "./+types/home";
import {
  getCertifications,
  getExperience,
  getProfile,
  getProjects,
  getSkills,
  getSocialLinks,
  queries,
} from "~/lib/db";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { mergeMeta, rootMeta } from "~/lib/meta";

export function meta({ data, matches }: Route.MetaArgs) {
  const parent = rootMeta(matches);
  if (!data) return parent;
  const title = `${data.profile.full_name} — ${data.profile.title}`;
  return mergeMeta(parent, [
    { title },
    { name: "description", content: data.profile.tagline },
    { property: "og:title", content: title },
    { property: "og:description", content: data.profile.tagline },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: data.profile.tagline },
  ]);
}

export async function loader({ context }: Route.LoaderArgs) {
  const [profile, experience, projects, skills, certifications, socials] =
    await Promise.all([
      getProfile(context),
      getExperience(context),
      getProjects(context, { featuredOnly: true }),
      getSkills(context),
      getCertifications(context),
      getSocialLinks(context),
    ]);
  if (!profile) {
    throw new Response("Profile not found. Run the seed migration.", {
      status: 500,
    });
  }
  return {
    profile,
    experience,
    projects,
    skills: queries.groupSkills(skills),
    certifications,
    socials,
  };
}

const valueProps = [
  {
    icon: Bot,
    title: "GenAI integrations that ship",
    body: "RAG, agentic workflows, and LLM-grounded internal tools that move production metrics — not demos.",
  },
  {
    icon: Workflow,
    title: "Automation that pays for itself",
    body: "100+ Python and Selenium pipelines saving 32 engineering hours every week.",
  },
  {
    icon: ShieldCheck,
    title: "99.9% uptime, every quarter",
    body: "Mission-critical e-commerce systems with proactive monitoring and disciplined RCA.",
  },
  {
    icon: Database,
    title: "Certified MongoDB Architect",
    body: "Designed schemas powering 10,000+ concurrent order flows on a Fortune 100 retailer.",
  },
];

export default function Home({ loaderData }: Route.ComponentProps) {
  const { profile, experience, projects, certifications, socials } = loaderData;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="container-tight relative py-20 md:py-28">
          <div className="max-w-3xl">
            <Badge variant="soft" className="mb-5">
              <Sparkles size={12} className="mr-1.5" />
              {profile.available
                ? "Open to senior software engineering roles"
                : "Currently in role"}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Hi, I'm <span className="text-gradient">{profile.full_name}</span>.
              <br />
              I build {""}
              <span className="text-gradient">AI-driven</span> tools that move
              real business metrics.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-[var(--color-muted-foreground)] leading-relaxed">
              {profile.tagline}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/projects">
                  See my work <ArrowRight size={16} />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/resume">View resume</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/contact">Get in touch</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
              {socials.map((s) => {
                const k = s.label.toLowerCase();
                const Icon = k.includes("github")
                  ? Github
                  : k.includes("linkedin")
                    ? Linkedin
                    : Mail;
                return (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-[var(--color-foreground)]"
                  >
                    <Icon size={16} />
                    {s.label}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Floating metric chips */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricChip kpi="3+ yrs" label="Software engineering" />
            <MetricChip kpi="30+" label="Slack bots shipped" />
            <MetricChip kpi="100+" label="Automation pipelines" />
            <MetricChip kpi="99.9%" label="Production uptime" />
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="container-tight py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {valueProps.map((v) => (
            <Card key={v.title} className="h-full">
              <CardHeader>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-brand-100)] text-[var(--color-brand-700)] dark:bg-[var(--color-brand-900)] dark:text-[var(--color-brand-200)]">
                  <v.icon size={20} />
                </div>
                <CardTitle className="pt-2">{v.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                  {v.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FEATURED PROJECTS */}
      <section className="container-tight py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              Selected work
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Featured projects
            </h2>
          </div>
          <Link
            to="/projects"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            All projects <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.slug}`} className="group">
              <Card className="h-full transition-all group-hover:border-[var(--color-brand-500)] group-hover:shadow-[var(--shadow-glow)]">
                <CardHeader>
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-brand-100)] text-[var(--color-brand-700)] dark:bg-[var(--color-brand-900)] dark:text-[var(--color-brand-200)]">
                    <Zap size={18} />
                  </div>
                  <CardTitle className="pt-2 group-hover:text-[var(--color-primary)] transition-colors">
                    {p.title}
                  </CardTitle>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {p.tagline}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {p.technologies.slice(0, 5).map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* EXPERIENCE PREVIEW */}
      <section className="container-tight py-20">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              Where I've worked
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Experience
            </h2>
            <p className="mt-4 text-[var(--color-muted-foreground)]">
              Three years shipping production AI tooling and reliability
              automation for a Fortune 100 retailer.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/experience">
                Full timeline <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
          <div className="md:col-span-2 space-y-4">
            {experience.map((e) => (
              <Card key={e.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{e.role}</CardTitle>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {e.start_date} – {e.end_date ?? "Present"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[var(--color-primary)]">
                    {e.company} · {e.location}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm leading-relaxed">
                    {e.highlights.slice(0, 3).map((h) => (
                      <li key={h} className="flex gap-2">
                        <span className="text-[var(--color-primary)] mt-1">
                          •
                        </span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CERTIFICATIONS STRIP */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-muted)]/40">
        <div className="container-tight py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] mb-5">
            Certifications & credentials
          </p>
          <div className="flex flex-wrap gap-2">
            {certifications.map((c) => (
              <Badge key={c.id} variant="outline" className="py-1 px-3">
                <Cpu size={12} className="mr-1.5" />
                {c.name}{" "}
                <span className="ml-1 text-[var(--color-muted-foreground)]">
                  · {c.issuer}
                </span>
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-tight py-20">
        <Card className="border-[var(--color-brand-500)]/30 bg-[var(--color-brand-50)] dark:bg-[var(--color-brand-900)]/30">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Looking for an engineer who ships AI tools that move metrics?
            </h2>
            <p className="mt-3 text-[var(--color-muted-foreground)] max-w-xl mx-auto">
              I'm open to senior software engineering roles across GenAI,
              automation, and backend platforms.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/contact">Start a conversation</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/resume">Download resume</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function MetricChip({ kpi, label }: { kpi: string; label: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <div className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">
        {kpi}
      </div>
      <div className="text-xs text-[var(--color-muted-foreground)] mt-1">
        {label}
      </div>
    </div>
  );
}
