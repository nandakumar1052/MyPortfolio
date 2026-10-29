import type { Route } from "./+types/skills";
import { getSkills, queries } from "~/lib/db";
import { mergeMeta, rootMeta } from "~/lib/meta";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function meta({ matches }: Route.MetaArgs) {
  const title = "Skills — Nanda Kumar";
  const description =
    "Technical skills: Python, Java, React, FastAPI, MongoDB, Generative AI (GPT-4o, Gemini, Llama), AWS, Docker, Kubernetes.";
  return mergeMeta(rootMeta(matches), [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: "https://nandakumaronline.com/skills" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ]);
}

export async function loader({ context }: Route.LoaderArgs) {
  return { skills: queries.groupSkills(await getSkills(context)) };
}

export default function Skills({ loaderData }: Route.ComponentProps) {
  return (
    <div className="container-tight py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Toolkit
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-1">
          Skills
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--color-muted-foreground)]">
          The stack I reach for in production. Bars reflect day-to-day fluency.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-5">
        {Object.entries(loaderData.skills).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((s) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    {s.level && (
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {labelFor(s.level)}
                      </span>
                    )}
                  </div>
                  {s.level && (
                    <div className="mt-1.5 h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-700)]"
                        style={{ width: `${(s.level / 5) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function labelFor(level: number) {
  return ["Familiar", "Comfortable", "Proficient", "Strong", "Expert"][
    Math.min(Math.max(level, 1), 5) - 1
  ];
}
