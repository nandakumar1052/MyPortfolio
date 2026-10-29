import type { Route } from "./+types/resume-docx";
import {
  getCertifications,
  getEducation,
  getExperience,
  getProfile,
  getSkills,
  getSocialLinks,
  getTailoredResume,
  type Experience,
  type Skill,
  type Certification,
} from "~/lib/db";
import { buildResumeDocx } from "~/lib/resume-docx.server";
import { parseResumeMarkdown } from "~/lib/resume-markdown.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const tailoredId = url.searchParams.get("tailored");

  const [profile, socials, experience, education, certifications, skills] =
    await Promise.all([
      getProfile(context),
      getSocialLinks(context),
      getExperience(context),
      getEducation(context),
      getCertifications(context),
      getSkills(context),
    ]);
  if (!profile) {
    throw new Response("Profile not found. Run the seed migration.", {
      status: 500,
    });
  }

  let resumeData = {
    profile,
    socials,
    experience,
    education,
    certifications,
    skills,
  };
  let filenameStem = profile.full_name.replace(/\s+/g, "_");

  if (tailoredId) {
    const tailored = await getTailoredResume(context, Number(tailoredId));
    if (!tailored) {
      throw new Response("Tailored resume not found.", { status: 404 });
    }
    const parsed = parseResumeMarkdown(tailored.markdown);

    // Build a "data view" that overlays the parsed sections on top of D1.
    // Sections the parser doesn't touch (full experience header fields,
    // education, social links) fall back to the canonical D1 data.
    const mergedProfile = parsed.summary
      ? { ...profile, summary: parsed.summary }
      : profile;

    const mergedExperience: Experience[] = experience.map((e, i) => {
      const overrideBullets = parsed.experienceHighlights?.get(i);
      return overrideBullets ? { ...e, highlights: overrideBullets } : e;
    });

    const mergedSkills: Skill[] = parsed.skills
      ? parsed.skills.map((s, i) => ({
          id: -(i + 1),
          category: s.category,
          name: s.name,
          level: s.level,
          sort_order: s.sort_order,
        }))
      : skills;

    const mergedCertifications: Certification[] = parsed.certifications
      ? parsed.certifications.map((c, i) => ({
          id: -(i + 1),
          name: c.name,
          issuer: c.issuer,
          issued_date: c.issued_date,
          credential_id: null,
          url: null,
          sort_order: c.sort_order,
        }))
      : certifications;

    resumeData = {
      profile: mergedProfile,
      socials,
      experience: mergedExperience,
      education,
      certifications: mergedCertifications,
      skills: mergedSkills,
    };

    const slug = tailored.job_title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    filenameStem = `${profile.full_name.replace(/\s+/g, "_")}_${slug || "tailored"}`;
  }

  const buffer = await buildResumeDocx(resumeData);
  const filename = `${filenameStem}_Resume.docx`;
  return new Response(buffer as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
