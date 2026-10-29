import type { AppLoadContext } from "react-router";

export type Profile = {
  id: number;
  full_name: string;
  title: string;
  tagline: string;
  summary: string;
  location: string;
  email: string;
  phone: string | null;
  available: number;
  years_experience: number;
  updated_at: string;
};

export type SocialLink = {
  id: number;
  label: string;
  url: string;
  sort_order: number;
};

export type ExperienceRow = {
  id: number;
  company: string;
  role: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  summary: string | null;
  highlights: string; // JSON
  technologies: string | null; // JSON
  sort_order: number;
};

export type Experience = Omit<ExperienceRow, "highlights" | "technologies"> & {
  highlights: string[];
  technologies: string[];
};

export type ProjectRow = {
  id: number;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  impact: string | null;
  technologies: string; // JSON
  repo_url: string | null;
  demo_url: string | null;
  featured: number;
  sort_order: number;
};

export type Project = Omit<ProjectRow, "technologies"> & {
  technologies: string[];
};

export type Skill = {
  id: number;
  category: string;
  name: string;
  level: number | null;
  sort_order: number;
};

export type Education = {
  id: number;
  institution: string;
  degree: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  details: string | null;
  sort_order: number;
};

export type Certification = {
  id: number;
  name: string;
  issuer: string;
  issued_date: string;
  credential_id: string | null;
  url: string | null;
  sort_order: number;
};

export type Award = {
  id: number;
  title: string;
  issuer: string;
  date: string;
  description: string | null;
  sort_order: number;
};

export type TailoredResume = {
  id: number;
  job_title: string;
  company: string | null;
  job_description: string;
  markdown: string;
  cover_letter: string | null;
  ai_model: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function listTailoredResumes(ctx: AppLoadContext): Promise<TailoredResume[]> {
  const result = await db(ctx)
    .prepare(
      "SELECT * FROM tailored_resumes ORDER BY created_at DESC LIMIT 200",
    )
    .all<TailoredResume>();
  return result.results ?? [];
}

export async function getTailoredResume(
  ctx: AppLoadContext,
  id: number,
): Promise<TailoredResume | null> {
  return await db(ctx)
    .prepare("SELECT * FROM tailored_resumes WHERE id = ?")
    .bind(id)
    .first<TailoredResume>();
}

export async function createTailoredResume(
  ctx: AppLoadContext,
  data: {
    job_title: string;
    company: string | null;
    job_description: string;
    markdown: string;
    cover_letter: string | null;
    ai_model: string | null;
  },
): Promise<number> {
  const res = await db(ctx)
    .prepare(
      `INSERT INTO tailored_resumes (job_title, company, job_description, markdown, cover_letter, ai_model)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id`,
    )
    .bind(
      data.job_title,
      data.company,
      data.job_description,
      data.markdown,
      data.cover_letter,
      data.ai_model,
    )
    .first<{ id: number }>();
  if (!res) throw new Error("Failed to insert tailored resume");
  return res.id;
}

export async function updateTailoredResumeMarkdown(
  ctx: AppLoadContext,
  id: number,
  markdown: string,
) {
  await db(ctx)
    .prepare(
      "UPDATE tailored_resumes SET markdown = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .bind(markdown, id)
    .run();
}

export async function updateTailoredResumeCoverLetter(
  ctx: AppLoadContext,
  id: number,
  cover_letter: string,
) {
  await db(ctx)
    .prepare(
      "UPDATE tailored_resumes SET cover_letter = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .bind(cover_letter, id)
    .run();
}

export async function deleteTailoredResume(ctx: AppLoadContext, id: number) {
  await db(ctx)
    .prepare("DELETE FROM tailored_resumes WHERE id = ?")
    .bind(id)
    .run();
}

export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  subject: string | null;
  message: string;
  ip_hash: string | null;
  created_at: string;
  read: number;
};

function db(ctx: AppLoadContext): D1Database {
  return ctx.cloudflare.env.DB;
}

function parseJsonArray(s: string | null | undefined): string[] {
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function getProfile(ctx: AppLoadContext): Promise<Profile | null> {
  return await db(ctx)
    .prepare("SELECT * FROM profile WHERE id = 1")
    .first<Profile>();
}

export async function getSocialLinks(ctx: AppLoadContext): Promise<SocialLink[]> {
  const result = await db(ctx)
    .prepare("SELECT * FROM social_links ORDER BY sort_order ASC, id ASC")
    .all<SocialLink>();
  return result.results ?? [];
}

export async function getExperience(ctx: AppLoadContext): Promise<Experience[]> {
  const result = await db(ctx)
    .prepare(
      "SELECT * FROM experience ORDER BY sort_order ASC, start_date DESC",
    )
    .all<ExperienceRow>();
  return (result.results ?? []).map((row) => ({
    ...row,
    highlights: parseJsonArray(row.highlights),
    technologies: parseJsonArray(row.technologies),
  }));
}

export async function getProjects(
  ctx: AppLoadContext,
  opts: { featuredOnly?: boolean } = {},
): Promise<Project[]> {
  const sql = opts.featuredOnly
    ? "SELECT * FROM projects WHERE featured = 1 ORDER BY sort_order ASC, id ASC"
    : "SELECT * FROM projects ORDER BY sort_order ASC, id ASC";
  const result = await db(ctx).prepare(sql).all<ProjectRow>();
  return (result.results ?? []).map((row) => ({
    ...row,
    technologies: parseJsonArray(row.technologies),
  }));
}

export async function getProjectBySlug(
  ctx: AppLoadContext,
  slug: string,
): Promise<Project | null> {
  const row = await db(ctx)
    .prepare("SELECT * FROM projects WHERE slug = ?")
    .bind(slug)
    .first<ProjectRow>();
  if (!row) return null;
  return { ...row, technologies: parseJsonArray(row.technologies) };
}

export async function getSkills(ctx: AppLoadContext): Promise<Skill[]> {
  const result = await db(ctx)
    .prepare(
      "SELECT * FROM skills ORDER BY category ASC, sort_order ASC, name ASC",
    )
    .all<Skill>();
  return result.results ?? [];
}

export async function getEducation(ctx: AppLoadContext): Promise<Education[]> {
  const result = await db(ctx)
    .prepare("SELECT * FROM education ORDER BY sort_order ASC, end_date DESC")
    .all<Education>();
  return result.results ?? [];
}

export async function getCertifications(
  ctx: AppLoadContext,
): Promise<Certification[]> {
  const result = await db(ctx)
    .prepare(
      "SELECT * FROM certifications ORDER BY sort_order ASC, issued_date DESC",
    )
    .all<Certification>();
  return result.results ?? [];
}

export async function getAwards(ctx: AppLoadContext): Promise<Award[]> {
  const result = await db(ctx)
    .prepare("SELECT * FROM awards ORDER BY sort_order ASC, date DESC")
    .all<Award>();
  return result.results ?? [];
}

export async function getContactMessages(
  ctx: AppLoadContext,
): Promise<ContactMessage[]> {
  const result = await db(ctx)
    .prepare("SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200")
    .all<ContactMessage>();
  return result.results ?? [];
}

export async function insertContactMessage(
  ctx: AppLoadContext,
  data: {
    name: string;
    email: string;
    company: string | null;
    subject: string | null;
    message: string;
    ip_hash: string | null;
  },
) {
  return await db(ctx)
    .prepare(
      `INSERT INTO contact_messages (name, email, company, subject, message, ip_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      data.name,
      data.email,
      data.company,
      data.subject,
      data.message,
      data.ip_hash,
    )
    .run();
}

export const queries = {
  /** Group skills by category for rendering. */
  groupSkills(skills: Skill[]): Record<string, Skill[]> {
    return skills.reduce<Record<string, Skill[]>>((acc, s) => {
      acc[s.category] = acc[s.category] ?? [];
      acc[s.category].push(s);
      return acc;
    }, {});
  },
};

// -------------------- Admin mutations --------------------

export async function upsertProfile(
  ctx: AppLoadContext,
  patch: Partial<Omit<Profile, "id" | "updated_at">>,
) {
  const current = await getProfile(ctx);
  const merged = { ...current, ...patch };
  await db(ctx)
    .prepare(
      `INSERT INTO profile
        (id, full_name, title, tagline, summary, location, email, phone, available, years_experience, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         full_name = excluded.full_name,
         title     = excluded.title,
         tagline   = excluded.tagline,
         summary   = excluded.summary,
         location  = excluded.location,
         email     = excluded.email,
         phone     = excluded.phone,
         available = excluded.available,
         years_experience = excluded.years_experience,
         updated_at = excluded.updated_at`,
    )
    .bind(
      merged.full_name ?? "",
      merged.title ?? "",
      merged.tagline ?? "",
      merged.summary ?? "",
      merged.location ?? "",
      merged.email ?? "",
      merged.phone ?? null,
      merged.available ?? 1,
      merged.years_experience ?? 0,
    )
    .run();
}

export async function upsertExperience(
  ctx: AppLoadContext,
  data: {
    id?: number;
    company: string;
    role: string;
    location: string | null;
    start_date: string;
    end_date: string | null;
    summary: string | null;
    highlights: string[];
    technologies: string[];
    sort_order: number;
  },
) {
  const highlights = JSON.stringify(data.highlights);
  const technologies = JSON.stringify(data.technologies);
  if (data.id) {
    await db(ctx)
      .prepare(
        `UPDATE experience SET
          company=?, role=?, location=?, start_date=?, end_date=?, summary=?,
          highlights=?, technologies=?, sort_order=?
         WHERE id=?`,
      )
      .bind(
        data.company,
        data.role,
        data.location,
        data.start_date,
        data.end_date,
        data.summary,
        highlights,
        technologies,
        data.sort_order,
        data.id,
      )
      .run();
  } else {
    await db(ctx)
      .prepare(
        `INSERT INTO experience
          (company, role, location, start_date, end_date, summary, highlights, technologies, sort_order)
         VALUES (?,?,?,?,?,?,?,?,?)`,
      )
      .bind(
        data.company,
        data.role,
        data.location,
        data.start_date,
        data.end_date,
        data.summary,
        highlights,
        technologies,
        data.sort_order,
      )
      .run();
  }
}

export async function deleteExperience(ctx: AppLoadContext, id: number) {
  await db(ctx).prepare("DELETE FROM experience WHERE id = ?").bind(id).run();
}

export async function upsertProject(
  ctx: AppLoadContext,
  data: {
    id?: number;
    title: string;
    slug: string;
    tagline: string;
    description: string;
    impact: string | null;
    technologies: string[];
    repo_url: string | null;
    demo_url: string | null;
    featured: number;
    sort_order: number;
  },
) {
  const technologies = JSON.stringify(data.technologies);
  if (data.id) {
    await db(ctx)
      .prepare(
        `UPDATE projects SET
          title=?, slug=?, tagline=?, description=?, impact=?,
          technologies=?, repo_url=?, demo_url=?, featured=?, sort_order=?
         WHERE id=?`,
      )
      .bind(
        data.title,
        data.slug,
        data.tagline,
        data.description,
        data.impact,
        technologies,
        data.repo_url,
        data.demo_url,
        data.featured,
        data.sort_order,
        data.id,
      )
      .run();
  } else {
    await db(ctx)
      .prepare(
        `INSERT INTO projects
          (title, slug, tagline, description, impact, technologies, repo_url, demo_url, featured, sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      )
      .bind(
        data.title,
        data.slug,
        data.tagline,
        data.description,
        data.impact,
        technologies,
        data.repo_url,
        data.demo_url,
        data.featured,
        data.sort_order,
      )
      .run();
  }
}

export async function deleteProject(ctx: AppLoadContext, id: number) {
  await db(ctx).prepare("DELETE FROM projects WHERE id = ?").bind(id).run();
}

export async function upsertSkill(
  ctx: AppLoadContext,
  data: {
    id?: number;
    category: string;
    name: string;
    level: number | null;
    sort_order: number;
  },
) {
  if (data.id) {
    await db(ctx)
      .prepare(
        "UPDATE skills SET category=?, name=?, level=?, sort_order=? WHERE id=?",
      )
      .bind(data.category, data.name, data.level, data.sort_order, data.id)
      .run();
  } else {
    await db(ctx)
      .prepare(
        "INSERT INTO skills (category, name, level, sort_order) VALUES (?,?,?,?)",
      )
      .bind(data.category, data.name, data.level, data.sort_order)
      .run();
  }
}

export async function deleteSkill(ctx: AppLoadContext, id: number) {
  await db(ctx).prepare("DELETE FROM skills WHERE id = ?").bind(id).run();
}

export async function upsertCertification(
  ctx: AppLoadContext,
  data: {
    id?: number;
    name: string;
    issuer: string;
    issued_date: string;
    credential_id: string | null;
    url: string | null;
    sort_order: number;
  },
) {
  if (data.id) {
    await db(ctx)
      .prepare(
        `UPDATE certifications SET
          name=?, issuer=?, issued_date=?, credential_id=?, url=?, sort_order=?
         WHERE id=?`,
      )
      .bind(
        data.name,
        data.issuer,
        data.issued_date,
        data.credential_id,
        data.url,
        data.sort_order,
        data.id,
      )
      .run();
  } else {
    await db(ctx)
      .prepare(
        `INSERT INTO certifications
          (name, issuer, issued_date, credential_id, url, sort_order)
         VALUES (?,?,?,?,?,?)`,
      )
      .bind(
        data.name,
        data.issuer,
        data.issued_date,
        data.credential_id,
        data.url,
        data.sort_order,
      )
      .run();
  }
}

export async function deleteCertification(ctx: AppLoadContext, id: number) {
  await db(ctx)
    .prepare("DELETE FROM certifications WHERE id = ?")
    .bind(id)
    .run();
}

export async function replaceAllSkills(
  ctx: AppLoadContext,
  rows: Array<{ category: string; name: string; level: number | null; sort_order: number }>,
) {
  await db(ctx).prepare("DELETE FROM skills").run();
  if (rows.length === 0) return;
  // D1 batch — atomic from a transaction perspective.
  await db(ctx).batch(
    rows.map((r) =>
      db(ctx)
        .prepare(
          "INSERT INTO skills (category, name, level, sort_order) VALUES (?,?,?,?)",
        )
        .bind(r.category, r.name, r.level, r.sort_order),
    ),
  );
}

export async function replaceAllCertifications(
  ctx: AppLoadContext,
  rows: Array<{ name: string; issuer: string; issued_date: string; sort_order: number }>,
) {
  await db(ctx).prepare("DELETE FROM certifications").run();
  if (rows.length === 0) return;
  await db(ctx).batch(
    rows.map((r) =>
      db(ctx)
        .prepare(
          "INSERT INTO certifications (name, issuer, issued_date, sort_order) VALUES (?,?,?,?)",
        )
        .bind(r.name, r.issuer, r.issued_date, r.sort_order),
    ),
  );
}

export async function markMessageRead(
  ctx: AppLoadContext,
  id: number,
  read: boolean,
) {
  await db(ctx)
    .prepare("UPDATE contact_messages SET read = ? WHERE id = ?")
    .bind(read ? 1 : 0, id)
    .run();
}

export async function deleteMessage(ctx: AppLoadContext, id: number) {
  await db(ctx)
    .prepare("DELETE FROM contact_messages WHERE id = ?")
    .bind(id)
    .run();
}
