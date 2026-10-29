import type { Route } from "./+types/about";
import {
  getAwards,
  getCertifications,
  getEducation,
  getProfile,
} from "~/lib/db";
import { mergeMeta, rootMeta } from "~/lib/meta";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Award as AwardIcon, GraduationCap, Trophy } from "lucide-react";

export function meta({ matches }: Route.MetaArgs) {
  const title = "About — Nanda Kumar";
  const description =
    "About Nanda Kumar — Software Engineer specializing in GenAI, automation, and Fortune 100 e-commerce platforms.";
  return mergeMeta(rootMeta(matches), [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: "https://nandakumaronline.com/about" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ]);
}

export async function loader({ context }: Route.LoaderArgs) {
  const [profile, education, certifications, awards] = await Promise.all([
    getProfile(context),
    getEducation(context),
    getCertifications(context),
    getAwards(context),
  ]);
  if (!profile) throw new Response("Profile not found", { status: 500 });
  return { profile, education, certifications, awards };
}

export default function About({ loaderData }: Route.ComponentProps) {
  const { profile, education, certifications, awards } = loaderData;

  return (
    <div className="container-tight py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold text-[var(--color-primary)]">About</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-1">
          {profile.title}
        </h1>
      </header>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4 text-[15px] leading-relaxed text-[var(--color-foreground)]/90">
          <p className="text-lg">{profile.summary}</p>
          <p>
            I'm based in {profile.location}. I care most about engineering work
            where the impact is visible — incident time saved, manual hours
            reclaimed, peak-traffic events that pass without paging anyone.
            Most of my recent work pairs Generative AI with deep operational
            knowledge of e-commerce systems, so the AI layer is grounded in
            real runbooks and real telemetry rather than vibes.
          </p>
          <p>
            Outside of feature work, I lead RCA on high-impact incidents,
            mentor newer engineers on Python and reliability practices, and
            keep my MongoDB schemas honest.
          </p>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap size={18} /> Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {education.map((e) => (
                <div key={e.id}>
                  <p className="font-semibold">{e.degree}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {e.institution} · {e.location}
                  </p>
                  {(e.start_date || e.end_date) && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                      {e.start_date} – {e.end_date}
                    </p>
                  )}
                  {e.details && (
                    <p className="text-sm mt-2 leading-relaxed">{e.details}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy size={18} /> Awards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {awards.map((a) => (
                <div key={a.id}>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {a.issuer} · {a.date}
                  </p>
                  {a.description && (
                    <p className="text-sm mt-1 leading-relaxed">
                      {a.description}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <AwardIcon size={20} /> Certifications
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
          {certifications.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-4">
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {c.issuer}
                </p>
                <Badge variant="outline" className="mt-2">
                  {c.issued_date}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
