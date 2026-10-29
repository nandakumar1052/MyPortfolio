// Generates public/og-image.png — the 1200x630 social-share preview image
// that appears when nandakumaronline.com is shared on LinkedIn, Slack,
// Twitter, etc.
//
// Run: npm run og:image
//
// Stack:
//   - satori          → JSX-like layout → SVG
//   - @resvg/resvg-js → SVG → PNG (using the Inter .otf in scripts/fonts/)

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const WIDTH = 1200;
const HEIGHT = 630;

// ─── Content ────────────────────────────────────────────────────────────────
const NAME = "Nanda Kumar";
const TITLE = "Software Engineer · GenAI & Automation";
const URL = "nandakumaronline.com";

// ─── Brand colors (mirrors app/app.css) ─────────────────────────────────────
// Pre-resolved from oklch() to sRGB hex because satori doesn't grok oklch.
const BRAND_700 = "#3531C7"; // gradient start (top-left)
const BRAND_500 = "#5A56FF"; // gradient end (bottom-right)
const BRAND_100 = "#E0E4FF";

// ─── Load fonts ─────────────────────────────────────────────────────────────
const [regular, bold] = await Promise.all([
  readFile("scripts/fonts/Inter-Regular.woff"),
  readFile("scripts/fonts/Inter-Bold.woff"),
]);

// ─── Layout (object-literal form — equivalent to JSX) ───────────────────────
const t = (text, style) => ({
  type: "div",
  props: { style, children: text },
});

const div = (style, children) => ({
  type: "div",
  props: { style, children },
});

const layout = div(
  {
    width: WIDTH,
    height: HEIGHT,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "72px 80px",
    backgroundImage: `linear-gradient(135deg, ${BRAND_700} 0%, ${BRAND_500} 100%)`,
    fontFamily: "Inter",
    color: "white",
    position: "relative",
  },
  [
    // Top row: NK badge + spacer
    div(
      {
        display: "flex",
        alignItems: "center",
      },
      [
        div(
          {
            width: 88,
            height: 88,
            borderRadius: 16,
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: -1,
          },
          "NK",
        ),
      ],
    ),

    // Center: name + title
    div(
      {
        display: "flex",
        flexDirection: "column",
        gap: 16,
      },
      [
        t(NAME, {
          fontSize: 112,
          fontWeight: 800,
          letterSpacing: -3,
          lineHeight: 1,
        }),
        t(TITLE, {
          fontSize: 42,
          fontWeight: 400,
          color: BRAND_100,
          letterSpacing: -0.5,
        }),
      ],
    ),

    // Bottom: URL on the left, decorative dot on the right
    div(
      {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      },
      [
        t(URL, {
          fontSize: 32,
          fontWeight: 600,
          color: "rgba(255, 255, 255, 0.85)",
        }),
        div(
          {
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: 0.5,
          },
          [
            div(
              {
                width: 10,
                height: 10,
                borderRadius: 9999,
                backgroundColor: "#4ADE80",
              },
              "",
            ),
            t("OPEN TO ROLES", {}),
          ],
        ),
      ],
    ),
  ],
);

// ─── satori → SVG ───────────────────────────────────────────────────────────
const svg = await satori(layout, {
  width: WIDTH,
  height: HEIGHT,
  fonts: [
    { name: "Inter", data: regular, weight: 400, style: "normal" },
    { name: "Inter", data: bold, weight: 700, style: "normal" },
  ],
});

// ─── resvg → PNG ────────────────────────────────────────────────────────────
const png = new Resvg(svg, {
  fitTo: { mode: "width", value: WIDTH },
}).render().asPng();

const outPath = "public/og-image.png";
await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, png);

console.log(`✓ Wrote ${outPath} (${png.length} bytes, ${WIDTH}×${HEIGHT})`);
