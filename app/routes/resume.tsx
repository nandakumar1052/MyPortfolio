import { Download, Mail, MapPin, Phone, Printer } from "lucide-react";
import type { Route } from "./+types/resume";
import {
  getCertifications,
  getEducation,
  getExperience,
  getProfile,
  getSkills,
  getSocialLinks,
  queries,
} from "~/lib/db";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { mergeMeta, rootMeta } from "~/lib/meta";

export function meta({ data, matches }: Route.MetaArgs) {
  const parent = rootMeta(matches);
  if (!data) return parent;
  const title = `Resume — ${data.profile.full_name}`;
  return mergeMeta(parent, [
    { title },
    { name: "description", content: data.profile.tagline },
    { property: "og:title", content: title },
    { property: "og:description", content: data.profile.tagline },
    { property: "og:url", content: "https://nandakumaronline.com/resume" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: data.profile.tagline },
  ]);
}

export async function loader({ context }: Route.LoaderArgs) {
  const [profile, experience, education, certifications, skills, socials] =
    await Promise.all([
      getProfile(context),
      getExperience(context),
      getEducation(context),
      getCertifications(context),
      getSkills(context),
      getSocialLinks(context),
    ]);
  if (!profile) throw new Response("Profile not found", { status: 500 });
  return {
    profile,
    experience,
    education,
    certifications,
    skills: queries.groupSkills(skills),
    socials,
  };
}

export default function Resume({ loaderData }: Route.ComponentProps) {
  const { profile, experience, education, certifications, skills, socials } =
    loaderData;

  return (
    <div className="container-tight py-12">
      {/* Action bar (hidden on print) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            ATS-friendly resume
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {profile.full_name}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer size={14} /> Print / Save as PDF
          </Button>
          <Button asChild>
            <a href="/resume.docx">
              <Download size={14} /> .docx
            </a>
          </Button>
        </div>
      </div>

      {/* The printable resume sheet. Single-column, no tables — fully ATS-parseable. */}
      <article className="bg-white text-black mx-auto max-w-[820px] p-10 shadow-sm rounded-md border border-[var(--color-border)] print:shadow-none print:border-0 print:p-0 print:max-w-none">
        <header className="text-center border-b border-gray-300 pb-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {profile.full_name}
          </h1>
          <p className="text-base font-medium mt-1">{profile.title}</p>
          <p className="text-sm mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {profile.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Mail size={12} /> {profile.email}
            </span>
            {profile.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone size={12} /> {profile.phone}
              </span>
            )}
          </p>
          <p className="text-sm mt-1 flex flex-wrap items-center justify-center gap-x-3">
            {socials.map((s) => (
              <a key={s.id} href={s.url} className="underline">
                {s.label}: {s.url.replace(/^https?:\/\//, "")}
              </a>
            ))}
          </p>
        </header>

        <Section title="Professional Summary">
          <p className="text-[13.5px] leading-relaxed">{profile.summary}</p>
        </Section>

        <Section title="Technical Skills">
          <div className="space-y-1 text-[13px]">
            {Object.entries(skills).map(([cat, items]) => (
              <p key={cat}>
                <span className="font-semibold">{cat}:</span>{" "}
                {items.map((s) => s.name).join(", ")}
              </p>
            ))}
          </div>
        </Section>

        <Section title="Professional Experience">
          {experience.map((e) => (
            <div key={e.id} className="mb-4 last:mb-0">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-bold text-[14px]">
                  {e.role}, {e.company}
                </p>
                <p className="text-[12px]">
                  {e.start_date} – {e.end_date ?? "Present"}
                </p>
              </div>
              {e.location && (
                <p className="text-[12px] italic">{e.location}</p>
              )}
              <ul className="mt-1.5 list-disc ms-5 space-y-1 text-[13px] leading-relaxed">
                {e.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          ))}
        </Section>

        <Section title="Education">
          {education.map((e) => (
            <div key={e.id} className="mb-2 last:mb-0">
              <div className="flex items-baseline justify-between">
                <p className="font-bold text-[14px]">{e.degree}</p>
                <p className="text-[12px]">
                  {e.start_date} – {e.end_date}
                </p>
              </div>
              <p className="text-[13px]">
                {e.institution}
                {e.location ? ` — ${e.location}` : ""}
              </p>
              {e.details && (
                <p className="text-[12.5px] mt-1 leading-relaxed">{e.details}</p>
              )}
            </div>
          ))}
        </Section>

        <Section title="Certifications">
          <ul className="list-disc ms-5 space-y-0.5 text-[13px]">
            {certifications.map((c) => (
              <li key={c.id}>
                <span className="font-semibold">{c.name}</span> — {c.issuer} (
                {c.issued_date})
              </li>
            ))}
          </ul>
        </Section>
      </article>

      <div className="print:hidden mt-6 text-center text-xs text-[var(--color-muted-foreground)]">
        Pro tip — for the cleanest ATS pass: use the <Badge variant="outline">.docx</Badge>{" "}
        download. PDFs can lose formatting in some applicant tracking systems.
      </div>

      <style>{`
        @media print {
          @page { size: Letter; margin: 0.5in; }
          body { background: white !important; }
          header, footer, nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <h2 className="text-[13px] font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2.5">
        {title}
      </h2>
      {children}
    </section>
  );
}
