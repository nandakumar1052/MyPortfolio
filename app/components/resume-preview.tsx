// Renders resume markdown into a styled HTML preview that visually mirrors
// the .docx layout (Calibri-like, centered name, section dividers, bullets).

import { useEffect, useMemo, useState } from "react";
import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: false,
});

export function ResumePreview({ markdown }: { markdown: string }) {
  // marked.parse can return a Promise in async mode; we use the sync overload.
  const [html, setHtml] = useState<string>("");
  useEffect(() => {
    const out = marked.parse(markdown, { async: false }) as string;
    setHtml(out);
  }, [markdown]);

  return (
    <div className="rounded-md border border-[var(--color-border)] bg-white text-black p-8 max-h-[70vh] overflow-auto preview-doc">
      <div
        className="prose-resume"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style>{`
        .preview-doc {
          font-family: "Calibri", system-ui, -apple-system, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
        }
        .prose-resume h1 {
          text-align: center;
          font-size: 20pt;
          font-weight: 700;
          margin: 0;
        }
        .prose-resume h1 + p {
          text-align: center;
          margin-top: 6px;
        }
        .prose-resume h2 {
          font-size: 12pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid #999;
          padding-bottom: 2px;
          margin-top: 18px;
          margin-bottom: 8px;
        }
        .prose-resume h3 {
          font-size: 11.5pt;
          font-weight: 700;
          margin-top: 12px;
          margin-bottom: 2px;
        }
        .prose-resume p {
          margin: 4px 0;
        }
        .prose-resume ul {
          padding-left: 20px;
          margin: 6px 0;
        }
        .prose-resume li {
          margin-bottom: 3px;
        }
        .prose-resume hr {
          border: 0;
          border-top: 1px solid #ddd;
          margin: 10px 0;
        }
        .prose-resume a {
          color: #1F4E79;
          text-decoration: underline;
        }
        .prose-resume strong { font-weight: 700; }
      `}</style>
    </div>
  );
}

/** Server-side markdown→html (used for SSR initial render). */
export function renderMarkdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}
