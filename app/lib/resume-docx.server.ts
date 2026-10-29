// Builds an ATS-friendly .docx in memory from structured resume data.
// Used by /resume.docx (live) and scripts/build-resume-docx.mjs (offline).

import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type {
  Certification,
  Education,
  Experience,
  Profile,
  SocialLink,
  Skill,
} from "./db";

const FONT = "Calibri";

export type ResumeData = {
  profile: Profile;
  socials: SocialLink[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  skills: Skill[];
};

export async function buildResumeDocx(data: ResumeData): Promise<Uint8Array> {
  const { profile, socials, experience, education, certifications, skills } =
    data;

  const t = (text: string, opts: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
  } = {}) =>
    new TextRun({
      text,
      font: FONT,
      size: opts.size ?? 22,
      bold: opts.bold,
      italics: opts.italic,
    });

  const p = (
    children: TextRun[] | (TextRun | ExternalHyperlink)[],
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType],
  ) =>
    new Paragraph({
      children,
      alignment,
      spacing: { after: 80 },
    });

  const heading = (text: string) =>
    new Paragraph({
      children: [t(text, { bold: true, size: 24 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
      border: {
        bottom: { color: "808080", space: 1, style: "single", size: 6 },
      },
    });

  const bullet = (text: string) =>
    new Paragraph({
      children: [t(text)],
      bullet: { level: 0 },
      spacing: { after: 60 },
    });

  const link = (text: string, url: string) =>
    new ExternalHyperlink({
      link: url,
      children: [
        new TextRun({
          text,
          style: "Hyperlink",
          font: FONT,
          size: 20,
          color: "1F4E79",
          underline: {},
        }),
      ],
    });

  // ---- Skills grouped by category ----
  const skillsByCategory = skills.reduce<Record<string, string[]>>((acc, s) => {
    acc[s.category] = acc[s.category] ?? [];
    acc[s.category].push(s.name);
    return acc;
  }, {});

  // ---- Header ----
  const header: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [t(profile.full_name, { bold: true, size: 36 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [t(profile.title, { size: 22 })],
    }),
  ];

  const contactBits = [profile.location, profile.phone, profile.email]
    .filter(Boolean)
    .join("  |  ");
  if (contactBits) {
    header.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [t(contactBits, { size: 20 })],
      }),
    );
  }

  if (socials.length > 0) {
    const socialChildren: (TextRun | ExternalHyperlink)[] = [];
    socials.forEach((s, i) => {
      if (i > 0) socialChildren.push(t("  |  ", { size: 20 }));
      socialChildren.push(link(s.label, s.url));
    });
    header.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: socialChildren,
      }),
    );
  }

  // ---- Body ----
  const body: Paragraph[] = [
    ...header,
    heading("Professional Summary"),
    p([t(profile.summary)]),

    heading("Technical Skills"),
    ...Object.entries(skillsByCategory).map(([cat, items]) =>
      p([t(`${cat}: `, { bold: true }), t(items.join(", "))]),
    ),

    heading("Professional Experience"),
    ...experience.flatMap((e) => {
      const dates = `${e.start_date} – ${e.end_date ?? "Present"}`;
      return [
        p([
          t(`${e.role}, `, { bold: true }),
          t(e.company, { bold: true }),
          t(`  —  ${dates}`, { italic: true }),
        ]),
        ...(e.location ? [p([t(e.location, { italic: true })])] : []),
        ...e.highlights.map(bullet),
      ];
    }),

    heading("Education"),
    ...education.flatMap((e) => {
      const dates = [e.start_date, e.end_date].filter(Boolean).join(" – ");
      return [
        p([
          t(e.degree, { bold: true }),
          ...(dates ? [t(`  —  ${dates}`, { italic: true })] : []),
        ]),
        p([
          t(
            `${e.institution}${e.location ? `, ${e.location}` : ""}`,
          ),
        ]),
        ...(e.details ? [p([t(e.details)])] : []),
      ];
    }),

    heading("Certifications"),
    ...certifications.map((c) =>
      bullet(`${c.name} — ${c.issuer}, ${c.issued_date}`),
    ),
  ];

  const doc = new Document({
    creator: profile.full_name,
    title: `${profile.full_name} - Resume`,
    description: "ATS-optimized resume",
    styles: {
      default: {
        document: { run: { font: FONT, size: 22 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 900, right: 900 },
          },
        },
        children: body,
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf);
}
