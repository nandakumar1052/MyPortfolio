// Render structured resume data → markdown, AND parse a known-shape
// markdown document back into structured updates for D1.
//
// Round-trip scope (what parseResumeMarkdown writes back):
//   - Professional Summary  → profile.summary
//   - Technical Skills      → skills table (replace all)
//   - Professional Experience (top role's bullets only) → experience[0].highlights
//   - Certifications        → certifications table (replace all)
//
// Out of scope (rendered but not parsed back): header fields, full experience
// structure, education, awards. Edit those in their dedicated /admin/* pages.

import type {
  Certification,
  Experience,
  Profile,
  SocialLink,
  Skill,
  Education,
} from "./db";

export type ResumeData = {
  profile: Profile;
  socials: SocialLink[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  skills: Skill[];
};

// ---------- Render ----------

export function buildResumeMarkdown(data: ResumeData): string {
  const { profile, socials, experience, education, certifications, skills } =
    data;

  const skillsByCategory = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    acc[s.category] = acc[s.category] ?? [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const lines: string[] = [];

  lines.push(`# ${profile.full_name}`, "");
  lines.push(`**${profile.title}**`, "");
  lines.push(
    [profile.location, profile.phone, profile.email]
      .filter(Boolean)
      .join(" · "),
  );
  if (socials.length > 0) {
    lines.push(socials.map((s) => `${s.label}: ${s.url}`).join(" · "));
  }
  lines.push("", "---", "", "## Professional Summary", "");
  lines.push(profile.summary, "");

  lines.push("---", "", "## Technical Skills", "");
  for (const [cat, items] of Object.entries(skillsByCategory)) {
    lines.push(`- **${cat}:** ${items.map((s) => s.name).join(", ")}`);
  }
  lines.push("");

  lines.push("---", "", "## Professional Experience", "");
  for (const e of experience) {
    const dates = `${e.start_date} – ${e.end_date ?? "Present"}`;
    lines.push(`### ${e.role} — ${e.company}`);
    lines.push(
      [e.location, dates].filter(Boolean).join(" · "),
      "",
    );
    if (e.summary) lines.push(e.summary, "");
    for (const h of e.highlights) lines.push(`- ${h}`);
    lines.push("");
  }

  lines.push("---", "", "## Education", "");
  for (const ed of education) {
    const dates = [ed.start_date, ed.end_date].filter(Boolean).join(" – ");
    lines.push(`### ${ed.degree}`);
    lines.push(
      [ed.institution, ed.location, dates].filter(Boolean).join(" · "),
      "",
    );
    if (ed.details) lines.push(ed.details, "");
  }

  lines.push("---", "", "## Certifications", "");
  for (const c of certifications) {
    lines.push(`- **${c.name}** — ${c.issuer}, ${c.issued_date}`);
  }
  lines.push("");

  return lines.join("\n");
}

// ---------- Parse ----------

export type ParsedSection<T> = { value?: T; warning?: string };

export type ParseResult = {
  summary?: string;
  /** Highlights keyed by experience index (0 = top job). Only entries the parser found. */
  experienceHighlights?: Map<number, string[]>;
  skills?: Array<{
    category: string;
    name: string;
    level: number | null;
    sort_order: number;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    issued_date: string;
    sort_order: number;
  }>;
  warnings: string[];
  changed: { summary: boolean; highlights: boolean; skills: boolean; certifications: boolean };
};

const MONTHS: Record<string, string> = {
  jan: "01", january: "01",
  feb: "02", february: "02",
  mar: "03", march: "03",
  apr: "04", april: "04",
  may: "05",
  jun: "06", june: "06",
  jul: "07", july: "07",
  aug: "08", august: "08",
  sep: "09", sept: "09", september: "09",
  oct: "10", october: "10",
  nov: "11", november: "11",
  dec: "12", december: "12",
};

/** Convert "September 2024" or "2024-09" or "09/2024" → "2024-09". Returns null if unparseable. */
function normalizeMonthYear(raw: string): string | null {
  const s = raw.trim();
  // YYYY-MM
  let m = s.match(/^(\d{4})-(\d{2})$/);
  if (m) return s;
  // MM/YYYY
  m = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[2]}-${m[1].padStart(2, "0")}`;
  // "September 2024" or "Sept 2024"
  m = s.match(/^([A-Za-z.]+)\s+(\d{4})$/);
  if (m) {
    const month = MONTHS[m[1].toLowerCase().replace(".", "")];
    if (month) return `${m[2]}-${month}`;
  }
  return null;
}

/** Split markdown by H2 (## ) headings, returning a Map<headingText, content>. */
function splitH2Sections(md: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = md.split(/\r?\n/);
  let current: string | null = null;
  let buf: string[] = [];
  for (const line of lines) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      if (current !== null) {
        sections.set(current, buf.join("\n").trim());
      }
      current = m[1].trim();
      buf = [];
    } else if (current !== null) {
      buf.push(line);
    }
  }
  if (current !== null) {
    sections.set(current, buf.join("\n").trim());
  }
  return sections;
}

export function parseResumeMarkdown(md: string): ParseResult {
  const result: ParseResult = {
    warnings: [],
    changed: {
      summary: false,
      highlights: false,
      skills: false,
      certifications: false,
    },
  };

  const sections = splitH2Sections(md);
  const knownHeadings = new Set([
    "Professional Summary",
    "Technical Skills",
    "Professional Experience",
    "Education",
    "Certifications",
    "Awards & Recognition",
    "Awards",
    "Selected Projects",
  ]);
  for (const heading of sections.keys()) {
    if (!knownHeadings.has(heading)) {
      result.warnings.push(
        `Section "## ${heading}" was kept in the markdown but is not parsed back to the database.`,
      );
    }
  }

  // Summary
  const summary = sections.get("Professional Summary");
  if (summary !== undefined) {
    // strip horizontal rules / extra whitespace
    const cleaned = summary.replace(/^---+$/gm, "").trim();
    if (cleaned) {
      result.summary = cleaned;
      result.changed.summary = true;
    } else {
      result.warnings.push("Professional Summary section is empty — kept current value.");
    }
  }

  // Skills
  const skillsBlock = sections.get("Technical Skills");
  if (skillsBlock !== undefined) {
    const parsed: ParseResult["skills"] = [];
    let order = 0;
    const seenCategories = new Map<string, number>();
    let bad = 0;
    for (const raw of skillsBlock.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("---")) continue;
      const m = line.match(/^-\s+\*\*(.+?)\s*:\s*\*\*\s*(.+)$/);
      if (!m) {
        // Tolerate "* **Cat:** items" too
        const m2 = line.match(/^\*\s+\*\*(.+?)\s*:\s*\*\*\s*(.+)$/);
        if (!m2) {
          bad += 1;
          continue;
        }
      }
      const match = m ?? line.match(/^\*\s+\*\*(.+?)\s*:\s*\*\*\s*(.+)$/);
      if (!match) continue;
      const category = match[1].trim();
      const itemsRaw = match[2].trim();
      let subOrder = seenCategories.get(category) ?? 0;
      for (const item of itemsRaw.split(",")) {
        const name = item.trim();
        if (!name) continue;
        subOrder += 1;
        parsed.push({ category, name, level: null, sort_order: subOrder });
        order += 1;
      }
      seenCategories.set(category, subOrder);
    }
    if (bad > 0) {
      result.warnings.push(
        `${bad} skills line${bad > 1 ? "s" : ""} didn't match the "- **Category:** items" format and were skipped.`,
      );
    }
    if (parsed.length > 0) {
      result.skills = parsed;
      result.changed.skills = true;
    } else {
      result.warnings.push("No skills parsed from Technical Skills section — kept current data.");
    }
  }

  // Experience highlights, positional (Nth ### heading → Nth experience by sort_order)
  const expBlock = sections.get("Professional Experience");
  if (expBlock !== undefined) {
    const lines = expBlock.split(/\r?\n/);
    const perEntry = new Map<number, string[]>();
    let idx = -1;
    for (const raw of lines) {
      const line = raw.trim();
      if (line.startsWith("### ")) {
        idx += 1;
        perEntry.set(idx, []);
        continue;
      }
      if (idx < 0) continue;
      const m = line.match(/^-\s+(.+)$/) ?? line.match(/^\*\s+(.+)$/);
      if (m) perEntry.get(idx)!.push(m[1].trim());
    }
    // Drop empty entries (a ### heading with no bullets means "leave the DB untouched for this slot").
    for (const [k, v] of perEntry) {
      if (v.length === 0) perEntry.delete(k);
    }
    if (idx === -1) {
      result.warnings.push(
        "Couldn't find any '### Role — Company' subheading. Experience not updated.",
      );
    } else if (perEntry.size === 0) {
      result.warnings.push(
        "Found job headings but no bullets underneath any. Experience not updated.",
      );
    } else {
      result.experienceHighlights = perEntry;
      result.changed.highlights = true;
    }
  }

  // Certifications
  const certsBlock = sections.get("Certifications");
  if (certsBlock !== undefined) {
    const certs: ParseResult["certifications"] = [];
    let order = 0;
    let bad = 0;
    for (const raw of certsBlock.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("---")) continue;
      // - **Name** — Issuer, Date
      const m = line.match(
        /^[-*]\s+\*\*(.+?)\*\*\s+[—\-–]\s+(.+?),\s+(.+)$/,
      );
      if (!m) {
        bad += 1;
        continue;
      }
      const name = m[1].trim();
      const issuer = m[2].trim();
      const dateRaw = m[3].trim();
      const normalized = normalizeMonthYear(dateRaw);
      const issued_date = normalized ?? dateRaw;
      if (!normalized) {
        result.warnings.push(
          `Date "${dateRaw}" on certification "${name}" couldn't be parsed; stored as-is.`,
        );
      }
      order += 1;
      certs.push({ name, issuer, issued_date, sort_order: order });
    }
    if (bad > 0) {
      result.warnings.push(
        `${bad} certification line${bad > 1 ? "s" : ""} didn't match the "- **Name** — Issuer, Date" format and were skipped.`,
      );
    }
    if (certs.length > 0) {
      result.certifications = certs;
      result.changed.certifications = true;
    } else {
      result.warnings.push("No certifications parsed — kept current data.");
    }
  }

  return result;
}
