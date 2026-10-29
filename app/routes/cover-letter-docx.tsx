import type { Route } from "./+types/cover-letter-docx";
import { getProfile, getTailoredResume } from "~/lib/db";
import { buildCoverLetterDocx } from "~/lib/cover-letter-docx.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const tailoredId = url.searchParams.get("tailored");
  if (!tailoredId) {
    throw new Response(
      "Missing ?tailored=ID — cover letters are always per tailored resume.",
      { status: 400 },
    );
  }

  const [profile, tailored] = await Promise.all([
    getProfile(context),
    getTailoredResume(context, Number(tailoredId)),
  ]);
  if (!profile) throw new Response("Profile not found", { status: 500 });
  if (!tailored)
    throw new Response("Tailored resume not found", { status: 404 });
  if (!tailored.cover_letter || !tailored.cover_letter.trim()) {
    throw new Response(
      "This tailored resume has no cover letter yet. Generate one from the admin page first.",
      { status: 404 },
    );
  }

  const buffer = await buildCoverLetterDocx({
    profile,
    jobTitle: tailored.job_title,
    company: tailored.company,
    body: tailored.cover_letter,
  });

  const slug = tailored.job_title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const filename = `${profile.full_name.replace(/\s+/g, "_")}_${slug || "tailored"}_CoverLetter.docx`;

  return new Response(buffer as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
