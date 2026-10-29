// Generates an ATS-friendly .docx from the resume content.
// Run: npm run resume:docx
// Output: public/Nanda_Kumar_Resume.docx (downloadable from /resume page)

import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  ExternalHyperlink,
} from "docx";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const FONT = "Calibri"; // Highly ATS-friendly and ships with Word.

// ---------- helpers ----------
const p = (children, opts = {}) =>
  new Paragraph({
    children: Array.isArray(children) ? children : [children],
    spacing: { after: 80, ...opts.spacing },
    alignment: opts.alignment,
  });

const t = (text, opts = {}) =>
  new TextRun({
    text,
    font: FONT,
    size: opts.size ?? 22, // half-points: 22 = 11pt
    bold: opts.bold,
    italics: opts.italic,
    color: opts.color,
    break: opts.break,
  });

const heading = (text) =>
  new Paragraph({
    children: [t(text, { bold: true, size: 24 })], // 12pt
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    border: {
      bottom: { color: "808080", space: 1, style: "single", size: 6 },
    },
  });

const bullet = (text) =>
  new Paragraph({
    children: [t(text)],
    bullet: { level: 0 },
    spacing: { after: 60 },
  });

const link = (text, url) =>
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

// ---------- content ----------
const NAME = "Nanda Kumar";
const TITLE = "Software Engineer — GenAI, Automation & Backend Platforms";
const LOCATION = "Bengaluru, India";
const PHONE = "+91 92062 57512";
const EMAIL = "nandakumar1052@gmail.com";
const LINKEDIN_URL = "https://www.linkedin.com/in/nanda-kumar-profile";
const GITHUB_URL = "https://github.com/nandakumar1052";

const summary =
  "Software Engineer with 3+ years of experience designing, building, and operating high-traffic applications for Fortune 100 e-commerce and enterprise clients. Specialized in Python and Java backend development, Generative AI (LLM / RAG) integration, and large-scale workflow automation. Proven record of shipping internal tools that improved operational efficiency by 45% and maintaining 99.9% uptime on mission-critical systems. Certified MongoDB Architect with hands-on experience across AWS, Docker, Kubernetes, and CI/CD pipelines.";

const skills = [
  ["Languages", "Python, Java, JavaScript, TypeScript, SQL, VB.NET, ASP.NET"],
  [
    "Backend / Frameworks",
    "FastAPI, Flask, REST APIs, Microservices, WebSockets, PyQt5",
  ],
  ["Frontend", "React, React Router, HTML5, CSS3, Tailwind CSS"],
  [
    "Databases",
    "MongoDB, CockroachDB, PostgreSQL, SQLite, Cloudflare D1",
  ],
  [
    "Generative AI / LLMs",
    "OpenAI GPT-4o, Google Gemini 2.5 Pro, Llama 3 (8B), Retrieval-Augmented Generation (RAG), Prompt Engineering, Vector Search, LLM Agents",
  ],
  [
    "Cloud & DevOps",
    "AWS (EC2, S3, Lambda, IAM), Cloudflare Workers, Docker, Kubernetes (K8s), Jenkins, GitHub Actions, Git, Linux",
  ],
  [
    "Testing & Automation",
    "Selenium WebDriver, PyTest, Headless Browser Automation, Slack API / Slack Bolt",
  ],
  [
    "Monitoring & Observability",
    "Grafana, Dynatrace, Log Analytics, Incident Response, Root Cause Analysis (RCA)",
  ],
  [
    "Methodologies",
    "Agile / Scrum, SDLC, Object-Oriented Programming (OOP), Design Patterns, Code Reviews, CI/CD",
  ],
];

const experience = [
  {
    role: "Software Engineer",
    company: "Accenture",
    location: "Bengaluru, India",
    dates: "October 2022 – Present",
    bullets: [
      "Architected a Generative AI (GenAI) support assistant grounded in 200+ internal Standard Operating Procedures (SOPs) using a Retrieval-Augmented Generation (RAG) pipeline; reduced mean time to resolve operational incidents by 90% across L1/L2 support teams.",
      "Designed and shipped 30+ Slack chatbots that surface real-time order, payment, and inventory signals to 500+ daily engineering and operations users, replacing manual dashboard lookups.",
      "Engineered 100+ Python and Selenium automation pipelines for proactive monitoring and anomaly detection across the e-commerce order stack, saving 32 engineering hours per week.",
      "Built a full-stack React and Python (FastAPI) dashboard that analyzes 10,000+ concurrent order flows in real time, preventing critical failures during peak holiday traffic events.",
      "Maintained 99.9% production uptime on mission-critical services for a Fortune 100 retailer; led Root Cause Analysis (RCA) for high-impact infrastructure incidents and authored remediation playbooks.",
      "Mentored junior engineers on Python, MongoDB schema design, and reliability best practices; standardized internal tooling and onboarding documentation.",
      "Collaborated cross-functionally with product, infrastructure, and on-call teams in an Agile / Scrum environment; partnered on SDLC milestones from design through deployment.",
    ],
  },
];

const education = [
  {
    degree: "Bachelor of Computer Applications (BCA)",
    school: "Kristu Jayanti College, Bangalore, India",
    dates: "2019 – 2022",
    detail:
      "Relevant coursework: Data Structures and Algorithms, Database Management Systems, Operating Systems, Computer Networks, Software Engineering, Web Development.",
  },
];

const certs = [
  ["MongoDB SI Architect Certification", "MongoDB", "September 2024"],
  ["MongoDB SI Associate Certification", "MongoDB", "August 2024"],
  ["Generative AI Fluency", "Udacity", "October 2025"],
  ["Python: Master Programming", "Udemy", "August 2023"],
  [
    "Cloud Security Fundamentals — Cloud Application Security",
    "Coursera",
    "December 2022",
  ],
  ["AWS Academy Cloud Foundations", "AWS Academy", "August 2021"],
];

const awards = [
  {
    title: "Accenture ACE Award",
    issuer: "Accenture",
    date: "July 2023",
    detail:
      "Recognized for measurable impact on production reliability and engineer productivity through GenAI and automation tooling.",
  },
];

const projects = [
  {
    title: "SOP-Grounded GenAI Support Assistant",
    detail:
      "RAG-based Slack assistant indexing 200+ internal runbooks; cut incident resolution time by ~90%. (Python, FastAPI, GPT-4o, Vector Search, MongoDB)",
  },
  {
    title: "Real-Time Order Flow Dashboard",
    detail:
      "React + FastAPI control tower handling 10,000+ concurrent orders during peak holiday traffic. (React, FastAPI, MongoDB, CockroachDB, WebSockets)",
  },
  {
    title: "Anomaly Detection Automation Suite",
    detail:
      "100+ scheduled Selenium and Python pipelines that surface regressions before customers report them. (Python, Selenium, Jenkins, GitHub Actions, Slack API)",
  },
];

// ---------- assemble ----------
const children = [
  // Name centered
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [t(NAME, { bold: true, size: 36 })], // 18pt
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [t(TITLE, { size: 22 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [
      t(`${LOCATION}  |  ${PHONE}  |  ${EMAIL}`, { size: 20 }),
    ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [
      link("LinkedIn", LINKEDIN_URL),
      t("  |  ", { size: 20 }),
      link("GitHub", GITHUB_URL),
    ],
  }),

  heading("Professional Summary"),
  p(t(summary)),

  heading("Technical Skills"),
  ...skills.map(([cat, list]) =>
    p([t(`${cat}: `, { bold: true }), t(list)]),
  ),

  heading("Professional Experience"),
  ...experience.flatMap((e) => [
    p([
      t(`${e.role}, `, { bold: true }),
      t(e.company, { bold: true }),
      t(`  —  ${e.dates}`, { italic: true }),
    ]),
    p(t(e.location, { italic: true })),
    ...e.bullets.map(bullet),
  ]),

  heading("Education"),
  ...education.flatMap((e) => [
    p([
      t(e.degree, { bold: true }),
      t(`  —  ${e.dates}`, { italic: true }),
    ]),
    p(t(e.school)),
    p(t(e.detail)),
  ]),

  heading("Certifications"),
  ...certs.map(([name, issuer, date]) =>
    bullet(`${name} — ${issuer}, ${date}`),
  ),

  heading("Awards & Recognition"),
  ...awards.flatMap((a) => [
    p([
      t(`${a.title}, `, { bold: true }),
      t(`${a.issuer}, ${a.date}`),
    ]),
    p(t(a.detail)),
  ]),

  heading("Selected Projects"),
  ...projects.flatMap((pr) => [
    p([t(pr.title, { bold: true }), t(` — ${pr.detail}`)]),
  ]),
];

const doc = new Document({
  creator: NAME,
  title: `${NAME} - Resume`,
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
          margin: {
            top: 720, // 0.5 inch in twips (1440 = 1in)
            bottom: 720,
            left: 900,
            right: 900,
          },
        },
      },
      children,
    },
  ],
});

const outPath = "public/Nanda_Kumar_Resume.docx";
await mkdir(dirname(outPath), { recursive: true });
const buffer = await Packer.toBuffer(doc);
await writeFile(outPath, buffer);
console.log(`✓ Wrote ${outPath} (${buffer.length} bytes)`);
