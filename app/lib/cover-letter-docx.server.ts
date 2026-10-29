// Builds an ATS-friendly business-letter .docx for a cover letter.
// Single column, Calibri 11pt, left-aligned. No tables or graphics.

import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { Profile } from "./db";

const FONT = "Calibri";

export async function buildCoverLetterDocx(args: {
  profile: Profile;
  jobTitle: string;
  company: string | null;
  body: string;
  date?: Date;
}): Promise<Uint8Array> {
  const { profile, jobTitle, company, body } = args;
  const date = args.date ?? new Date();

  const t = (text: string, opts: { bold?: boolean; size?: number } = {}) =>
    new TextRun({
      text,
      font: FONT,
      size: opts.size ?? 22, // 11pt
      bold: opts.bold,
    });

  const p = (
    children: TextRun[],
    spacing?: { after?: number; before?: number },
  ) => new Paragraph({ children, spacing: { after: 120, ...spacing } });

  const blank = () => new Paragraph({ children: [t("")], spacing: { after: 120 } });

  // Header block: name centered, contact below.
  const header: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [t(profile.full_name, { bold: true, size: 30 })], // 15pt
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        t(
          [profile.location, profile.phone, profile.email]
            .filter(Boolean)
            .join("  |  "),
          { size: 20 }, // 10pt
        ),
      ],
    }),
  ];

  // Date.
  const dateStr = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Body paragraphs: split on blank lines, render each as a paragraph.
  const bodyParas = body
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((para) => p([t(para)]));

  const recipientLines: Paragraph[] = [
    p([t("Hiring Team")], { after: 0 }),
  ];
  if (company) recipientLines.push(p([t(company)], { after: 0 }));

  const doc = new Document({
    creator: profile.full_name,
    title: `${profile.full_name} - Cover Letter - ${jobTitle}`,
    description: `Cover letter for ${jobTitle}${company ? ` at ${company}` : ""}`,
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
          },
        },
        children: [
          ...header,
          p([t(dateStr)]),
          blank(),
          ...recipientLines,
          blank(),
          p([t("Dear Hiring Team,")]),
          ...bodyParas,
          p([t("Sincerely,")], { after: 60 }),
          p([t(profile.full_name)]),
        ],
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf);
}
