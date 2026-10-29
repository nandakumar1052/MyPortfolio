import type { Route } from "./+types/experience";
import { getExperience } from "~/lib/db";
import { mergeMeta, rootMeta } from "~/lib/meta";
import { Badge } from "~/components/ui/badge";
import { dateRange } from "~/lib/utils";

export function meta({ matches }: Route.MetaArgs) {
  const title = "Experience — Nanda Kumar";
  const description =
    "Software engineering experience at Accenture: GenAI assistants, automation pipelines, and e-commerce reliability for Fortune 100 clients.";
  return mergeMeta(rootMeta(matches), [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: "https://nandakumaronline.com/experience" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ]);
}

export async function loader({ context }: Route.LoaderArgs) {
  return { experience: await getExperience(context) };
}

export default function Experience({ loaderData }: Route.ComponentProps) {
  return (
    <div className="container-tight py-16">
      <header className="mb-12">
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Career
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-1">
          Experience
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--color-muted-foreground)]">
          A timeline of the production work and the metrics it moved.
        </p>
      </header>

      <ol className="relative border-s border-[var(--color-border)] ms-3">
        {loaderData.experience.map((e) => (
          <li key={e.id} className="ms-8 pb-12 last:pb-0">
            <span className="absolute -start-2.5 mt-1.5 h-5 w-5 rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-background)]" />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{e.role}</h2>
              <span className="text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
                {dateRange(e.start_date, e.end_date)}
              </span>
            </div>
            <p className="text-base text-[var(--color-primary)] font-medium mt-1">
              {e.company}
              {e.location ? ` · ${e.location}` : ""}
            </p>
            {e.summary && (
              <p className="mt-3 text-[var(--color-muted-foreground)] leading-relaxed">
                {e.summary}
              </p>
            )}
            <ul className="mt-4 space-y-2.5">
              {e.highlights.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[var(--color-primary)] mt-1 shrink-0">
                    ▸
                  </span>
                  <span className="text-[15px] leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>
            {e.technologies.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {e.technologies.map((t) => (
                  <Badge key={t} variant="soft">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
