// Google Gemini API client — free tier via Google AI Studio.
// Get an API key at https://aistudio.google.com/app/apikey

import type { AppLoadContext } from "react-router";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiNotConfiguredError extends Error {
  constructor() {
    super(
      "GEMINI_API_KEY is not set. Add it to .dev.vars locally or `wrangler secret put GEMINI_API_KEY` in production.",
    );
  }
}

export class GeminiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type GeminiContent = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { code: number; message: string; status: string };
};

export async function callGemini(
  ctx: AppLoadContext,
  args: {
    systemInstruction: string;
    userMessage: string;
    temperature?: number;
  },
): Promise<string> {
  const apiKey = ctx.cloudflare.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiNotConfiguredError();

  const model = ctx.cloudflare.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const url = `${ENDPOINT}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    systemInstruction: {
      parts: [{ text: args.systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: args.userMessage }],
      },
    ] satisfies GeminiContent[],
    generationConfig: {
      temperature: args.temperature ?? 0.4,
      // Keep the model concise. A resume is roughly 600–900 tokens of markdown.
      maxOutputTokens: 4096,
      responseMimeType: "text/plain",
    },
    safetySettings: [
      // Resume content is benign; keep default safety but be liberal so the
      // model doesn't refuse standard career language.
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new GeminiError(res.status, `Gemini ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as GeminiResponse;

  if (data.promptFeedback?.blockReason) {
    throw new GeminiError(
      400,
      `Gemini blocked the prompt (${data.promptFeedback.blockReason}). Try shorter or less sensitive job description text.`,
    );
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("");
  if (!text) {
    throw new GeminiError(
      502,
      "Gemini returned no text. Try again or try a different model.",
    );
  }
  return text.trim();
}

// ---- Resume tailoring prompt ----

const SYSTEM_INSTRUCTION = `You are a resume tailoring assistant.

You receive two inputs:
1. A candidate's TRUTHFUL resume in markdown (this is the source of truth).
2. A job description.

Your job is to produce a tailored version of the resume optimized for THIS specific role and for Applicant Tracking System (ATS) parsing.

Hard rules — DO NOT BREAK THESE:
- Never invent, exaggerate, or fabricate. No new jobs, employers, titles, dates, degrees, certifications, schools, metrics, technologies, or impacts. Every claim must trace to the input resume.
- You MAY rephrase, reorder, omit, or condense existing content. You MAY surface a real skill or impact that's hidden too far down. You MAY rewrite a bullet to use language from the job description IF the underlying work genuinely matches.
- Preserve all dates and company names exactly as written. Preserve degree names and certification names exactly.
- If the job description asks for something the candidate doesn't have, do not add it. It's better to leave it out than to lie.

Format rules:
- Keep the same markdown structure: H1 name, H2 sections (Professional Summary, Technical Skills, Professional Experience, Education, Certifications, etc.), H3 for each job and degree, hyphen bullets ('- ').
- The Professional Summary should be 2–3 sentences focused on the role's must-haves.
- Technical Skills must use the format: '- **Category:** item1, item2, item3'. Front-load the categories and items most relevant to the JD. You may drop categories that aren't relevant; do not invent ones.
- Under each job (### Role — Company), keep 3–6 bullets. Lead with the most JD-relevant ones. Each bullet should start with a strong past-tense verb and quantify when possible (numbers from the original resume only).
- Keep certifications in the same '- **Name** — Issuer, Date' format.
- ATS-friendly: no tables, no columns, no emojis, no graphics, no markdown features beyond headings/lists/bold.

Output: return ONLY the tailored resume as markdown. No commentary, no preamble, no code fences.`;

// ---- Cover letter prompt ----

const COVER_LETTER_INSTRUCTION = `You are a cover letter writer for senior software-engineering roles.

You receive:
1. A candidate's truthful resume in markdown.
2. The job title and company they're applying to.
3. The job description.

Write a focused, ATS-friendly cover letter, 250–350 words.

Hard rules — DO NOT BREAK THESE:
- Never fabricate. Every fact must trace to the resume. No invented projects, employers, metrics, certifications, or tools.
- If the candidate's experience does not match a JD requirement, do not pretend it does. Either omit it or frame an adjacent real strength.
- Do not promise things the candidate cannot deliver (e.g. "I will hit X in 90 days"). Stick to verifiable claims about past work.
- Do not use clichés ("results-driven", "passionate self-starter", "team player"). Lead with specifics.

Voice & structure:
- Use first person, professional but warm. American or Indian English is fine — match the candidate.
- 3 paragraphs (or 4 if it fits naturally):
  1. **Opening:** one sentence stating the role and one specific reason this candidate is a strong fit. Mention the company by name.
  2. **Evidence:** 2–3 quantified achievements from the resume that map directly to the JD's needs. Cite real metrics (e.g. "reduced MTTR by 90%", "10,000+ concurrent orders"). Do not list every job — pick the most relevant work.
  3. **Closing:** what specifically excites the candidate about this role/team (extracted from the JD), and a one-line call to action.
- Optional 4th: only if there's a unique angle (e.g. a relevant cert that's a perfect match) and it doesn't make the letter feel padded.

Format:
- Output plain prose paragraphs separated by blank lines. No headings, no bullets, no markdown formatting beyond paragraph breaks.
- Do NOT include the candidate's address block, date, or recipient block — the system adds those.
- Do NOT include a salutation line ("Dear Hiring Manager,") or a sign-off ("Sincerely,") — the system adds those.
- Output ONLY the body paragraphs. No commentary, no preamble, no code fences.`;

export async function generateCoverLetter(
  ctx: AppLoadContext,
  args: {
    baseMarkdown: string;
    jobTitle: string;
    company: string | null;
    jobDescription: string;
  },
): Promise<string> {
  const userMessage = [
    "=== CANDIDATE RESUME (markdown — source of truth) ===",
    args.baseMarkdown,
    "",
    "=== ROLE I'M APPLYING FOR ===",
    `Title: ${args.jobTitle}`,
    `Company: ${args.company ?? "(not specified — write 'your team' instead of a company name)"}`,
    "",
    "=== JOB DESCRIPTION ===",
    args.jobDescription,
    "",
    "Write the cover letter body now. Return ONLY the body paragraphs.",
  ].join("\n");

  let raw = await callGemini(ctx, {
    systemInstruction: COVER_LETTER_INSTRUCTION,
    userMessage,
    temperature: 0.5,
  });
  raw = raw.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```\s*$/, "");
  }
  // Strip any salutation/sign-off the model snuck in anyway.
  raw = raw
    .replace(/^(Dear[^,\n]*,?\s*\n+)/i, "")
    .replace(/\n+(Sincerely|Best regards|Regards|Best|Kind regards|Yours truly|Warm regards)[\s\S]*$/i, "")
    .trim();
  return raw;
}

export async function tailorResumeMarkdown(
  ctx: AppLoadContext,
  args: {
    baseMarkdown: string;
    jobTitle: string;
    company: string | null;
    jobDescription: string;
  },
): Promise<string> {
  const userMessage = [
    "=== CANDIDATE RESUME (markdown — source of truth) ===",
    args.baseMarkdown,
    "",
    "=== ROLE I'M APPLYING FOR ===",
    `Title: ${args.jobTitle}`,
    args.company ? `Company: ${args.company}` : null,
    "",
    "=== JOB DESCRIPTION / REQUIREMENTS ===",
    args.jobDescription,
    "",
    "Produce the tailored markdown resume now. Return ONLY the markdown.",
  ]
    .filter((s): s is string => s !== null)
    .join("\n");

  let raw = await callGemini(ctx, {
    systemInstruction: SYSTEM_INSTRUCTION,
    userMessage,
    temperature: 0.4,
  });

  // Strip accidental code fences (some models wrap their output).
  raw = raw.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return raw.trim();
}
