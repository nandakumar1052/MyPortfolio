# Nanda Kumar — Portfolio

A full-stack portfolio site built on **React Router v7** running on **Cloudflare Workers**, backed by **Cloudflare D1** for content. Includes a protected `/admin` area for editing every section without redeploying.

```
React Router 7  →  Cloudflare Worker (SSR)  →  D1 (myportfoliodb)
```

---

## Prerequisites

> ⚠️ **Important — your Node.js must be 64-bit.**
> Cloudflare's local Workers runtime (`workerd`) is **not built for 32-bit Windows**. The `npm install` postinstall step will fail with `Unsupported platform: win32 ia32 LE` on 32-bit Node.
>
> Install **Node.js 22 LTS (x64)** from <https://nodejs.org>. Verify with:
>
> ```powershell
> node -p "process.arch"   # must print: x64
> node -v                  # should be v22 or newer
> ```

You'll also need a free [Cloudflare account](https://dash.cloudflare.com/sign-up) and the `wrangler` CLI is included as a dev dependency.

---

## 1. Install

```powershell
git clone <your-repo-url> MyPortfolio
cd MyPortfolio
npm install
```

If you previously tried to install on 32-bit Node, clean up first:

```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

## 2. Local environment variables

Copy the example file and fill in real values. **Never commit `.dev.vars`.**

```powershell
Copy-Item .dev.vars.example .dev.vars
```

`.dev.vars` keys:

| Key | What it does |
|-----|---|
| `SESSION_SECRET` | Signs the admin session cookie. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_PASSWORD` | The password you type into `/admin/login` to edit content. Pick something long. |

---

## 3. Set up the D1 database

The D1 binding is already wired in [wrangler.jsonc](./wrangler.jsonc) to your database:

```
database_name: myportfoliodb
database_id:   d73f6e91-ea2d-4af0-81b8-66999b86a842
```

Apply the migrations + seed data:

```powershell
# local D1 (used by `npm run dev`)
npm run db:migrate:local
npm run db:seed:local

# production D1 (the one in your Cloudflare dashboard)
npm run db:migrate:remote
npm run db:seed:remote
```

The seed file ([migrations/0002_seed.sql](./migrations/0002_seed.sql)) is **re-runnable** — it clears each table and reloads. Tweak it any time and re-run.

---

## 4. Run locally

```powershell
npm run dev
```

Open <http://localhost:5173>. The admin UI is at <http://localhost:5173/admin/login>.

---

## 5. Deploy to Cloudflare

```powershell
# First time only — store secrets in your Worker
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ADMIN_PASSWORD

# Build + deploy
npm run deploy
```

Wrangler will print the deployed URL (something like `nanda-portfolio.<your-subdomain>.workers.dev`). You can later attach a custom domain from the Cloudflare dashboard.

---

## Project structure

```
app/
  app.css                  Tailwind v4 + custom theme (OKLCH)
  root.tsx                 HTML shell, meta, error boundary
  routes.ts                Explicit route manifest
  components/              Nav, Footer, shadcn-style UI primitives
  layouts/                 public.tsx, admin.tsx (with auth guard)
  lib/
    db.ts                  Typed D1 queries + admin mutations
    session.server.ts      Cookie session + admin password check
    utils.ts               cn(), date helpers
  routes/                  All pages (public + /admin/*)

migrations/
  0001_init.sql            Schema
  0002_seed.sql            Re-runnable seed

workers/
  app.ts                   Cloudflare Worker entry (delegates to React Router)

scripts/
  build-resume-docx.mjs    Generates public/Nanda_Kumar_Resume.docx

docs/
  Nanda_Kumar_Resume.md    Source of truth for the resume
```

---

## Editing content

Three ways to edit, pick whichever you like:

1. **The admin UI** (`/admin`) — log in with `ADMIN_PASSWORD`, edit profile / experience / projects / skills / certifications / messages, save. Live on the next page reload.
2. **`wrangler d1 execute`** — run SQL straight against D1 from the command line.
3. **Update `migrations/0002_seed.sql` and re-run** — best when you want changes versioned in git.

---

## Regenerating the resume

The downloadable `.docx` lives in [`public/Nanda_Kumar_Resume.docx`](./public/Nanda_Kumar_Resume.docx). It's generated from the structured content in [`scripts/build-resume-docx.mjs`](./scripts/build-resume-docx.mjs).

```powershell
npm run resume:docx
```

The Markdown source ([`docs/Nanda_Kumar_Resume.md`](./docs/Nanda_Kumar_Resume.md)) is the human-readable mirror — keep it and the script in sync when you make significant edits.

---

## ATS-friendly resume notes

The new resume in [docs/Nanda_Kumar_Resume.md](./docs/Nanda_Kumar_Resume.md) is specifically tuned to pass through Applicant Tracking Systems (ATS):

- Single column, no tables, no text boxes, no headers/footers — these are the most common reasons ATS parsers mangle resumes.
- Standard section headers (Professional Summary, Technical Skills, Professional Experience, Education, Certifications, Awards & Recognition).
- Job titles spelled out exactly as recruiters search: `Software Engineer` (not `Software development Engineer`).
- Common keywords included in both expanded and shorthand forms: `Generative AI` and `GenAI`, `JavaScript` and `TypeScript`, `Kubernetes` and `K8s`, `Object-Oriented Programming` and `OOP`, `Retrieval-Augmented Generation` and `RAG`.
- Methodology keywords ATS scans for: `Agile / Scrum`, `SDLC`, `CI/CD`, `Code Reviews`, `Design Patterns`.
- Strong action verbs: Architected, Designed, Engineered, Built, Maintained, Mentored, Collaborated.
- Every bullet quantified — `90% faster resolution`, `30+ bots`, `100+ pipelines`, `32 hours/week saved`, `10,000+ concurrent orders`, `99.9% uptime`.
- Calibri 11pt body with standard margins — Word-friendly and well-supported by ATS.
- Prefer the **.docx** download for ATS submissions; the PDF (via `Print → Save as PDF` on `/resume`) is fine for human readers and most modern ATS.

---

## AI-tailored resumes

A second admin section, [/admin/resume/tailored](http://localhost:5173/admin/resume/tailored), lets you generate role-specific resume variants from a pasted job description. Powered by **Google Gemini** (free tier).

### How it works

1. You paste a job title, optional company, and the full job description.
2. The site builds your **base resume** as markdown from D1 and sends it to Gemini along with the JD and a strict prompt: *rephrase, reorder, and omit — never invent.*
3. In parallel, Gemini drafts a **cover letter** for the same role using the same source-of-truth resume.
4. Both are stored as a row in `tailored_resumes` (independent of your base resume).
5. You can edit the resume markdown and cover-letter prose, see live previews, and download each as its own `.docx`:
   - `/resume.docx?tailored=<id>` — the role-tailored resume
   - `/cover-letter.docx?tailored=<id>` — the matching cover letter, wrapped in a standard letter format (name + contact header, today's date, salutation, sign-off)
6. The detail page has a chip-strip switcher between all your saved drafts, plus a **Regenerate** button on the cover letter card if you want a fresh take without touching the resume.
7. You can keep a history of role-specific resume + cover-letter pairs, one per application.

### Setting up the Gemini key

- Get a free key at <https://aistudio.google.com/app/apikey> (no credit card needed, 15 req/min on `gemini-2.5-flash`).
- **Local dev:** add it to `.dev.vars` as `GEMINI_API_KEY=...`. Optional: change `GEMINI_MODEL` if you want `gemini-2.0-flash` or `gemini-1.5-flash`.
- **Production:** `npx wrangler secret put GEMINI_API_KEY`.

> ⚠️ **Rotate the Gemini key** if it's ever been pasted into a chat, log, or PR description. Generating a fresh one is free and instant at the same URL — just revoke the old one.

### Prompt-engineering guardrails

The system prompt (in [app/lib/gemini.server.ts](app/lib/gemini.server.ts)) forbids fabrication: no invented jobs, dates, titles, schools, certifications, metrics, or technologies. The model is only allowed to **rephrase, reorder, condense, and omit** content from the base resume. This keeps the tailored output ATS-friendly *and* truthful — recruiters and interviewers will see the same facts as on the website.

### Limits to know about

- The `.docx` download for a tailored resume re-uses the base resume's experience header fields (company, role, dates, location) and education / awards. The parser only writes back: **Summary**, **per-job bullets**, **Skills**, **Certifications** — which is exactly what changes per role anyway.
- Gemini free tier has a daily request cap. If you exceed it the create form will surface a clear error.
- Resume tailoring is not magic — review the draft before downloading. A 30-second skim catches the occasional rephrase that drifts too far.

---

## Security hardening (what's built in)

| Defense | Where | What it does |
|---|---|---|
| Encrypted secrets | `wrangler secret put` | `SESSION_SECRET` + `ADMIN_PASSWORD` + `TURNSTILE_SECRET_KEY` stored encrypted at rest on Cloudflare |
| Signed session cookie | [app/lib/session.server.ts](app/lib/session.server.ts) | `httpOnly`, `sameSite=lax`, `secure` (in prod), HMAC-signed |
| Constant-time password compare | [app/lib/session.server.ts](app/lib/session.server.ts) | No timing leak |
| Parameterized SQL | [app/lib/db.ts](app/lib/db.ts) | All queries use `prepare().bind()` |
| Same-origin / CSRF guard | [app/lib/security.server.ts](app/lib/security.server.ts) | Rejects POST/PUT/etc. whose Origin or Referer doesn't match the host. Wired into `requireAdmin`, `/admin/login`, `/admin/logout` |
| Login rate limit (in-memory) | [app/lib/security.server.ts](app/lib/security.server.ts) | 5 failed attempts per IP per 5 minutes → 429. Per Worker instance, defense-in-depth. **Pair with a Cloudflare Rate Limiting rule for durable protection.** |
| Security headers | [workers/app.ts](workers/app.ts) | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, HSTS (prod only) |
| Cloudflare Turnstile on contact form | [app/routes/contact.tsx](app/routes/contact.tsx) | Server-verifies the captcha token before writing to D1. Disabled gracefully if no key set. |
| Honeypot field | [app/routes/contact.tsx](app/routes/contact.tsx) | Catches naive form spammers |
| IP hashing | [app/routes/contact.tsx](app/routes/contact.tsx) | SHA-256 before storing in `contact_messages.ip_hash` |

### Production hardening checklist

Before announcing the URL, do all of these:

1. **Rotate `ADMIN_PASSWORD`** to something long (24+ random chars):
   ```powershell
   node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
   npx wrangler secret put ADMIN_PASSWORD
   ```
2. **Rotate `SESSION_SECRET`** the same way (any 32+ bytes hex/base64).
3. **Rotate `GEMINI_API_KEY`** if it was ever pasted into a chat / log / PR.
   ```powershell
   # 1. Get a fresh key at https://aistudio.google.com/app/apikey and revoke the old one.
   npx wrangler secret put GEMINI_API_KEY
   ```
4. **Set up real Turnstile keys** in [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile), then:
   ```powershell
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```
   Add `TURNSTILE_SITE_KEY` to the `vars` block of [wrangler.jsonc](wrangler.jsonc) (it's public). Redeploy.
5. **Add a Cloudflare Rate Limiting rule** for `/admin/login` (Dashboard → your Worker → Rate Limiting → `POST` on `/admin/login`, threshold `5 / 60s`, action `Block`). Free tier.
6. **Use a custom domain** instead of `*.workers.dev` if you can — closes a same-registrable-domain edge case for SameSite cookies.
7. **Schedule a D1 backup** — a weekly GitHub Action running `wrangler d1 export myportfoliodb --remote --output=backup.sql` and committing it to a private repo is enough.

### Known trade-offs

- **CSP allows `'unsafe-inline'` for scripts and styles** — needed because React Router emits inline hydration data and we use inline `<style>` blocks (e.g. the print stylesheet on `/resume`). Switching to nonce-based CSP would require deeper changes to the SSR entry.
- **`Retry-After` header is dropped on 429** — React Router strips custom headers from thrown `Response`. The 429 status is preserved, which is what blocks attackers; well-behaved clients just don't get an exact retry hint.
- **In-memory login limiter resets when the Worker recycles.** It's defense-in-depth; the Cloudflare Rate Limiting rule (step 4 above) is the durable layer.

---

## Useful commands

```powershell
npm run dev              # dev server with HMR
npm run build            # production build
npm run deploy           # build + wrangler deploy
npm run typecheck        # tsc + react-router typegen
npm run preview          # preview production build locally
npm run resume:docx      # regenerate the resume .docx

npm run db:migrate:local # apply migrations to local D1
npm run db:seed:local    # reload seed data into local D1
npm run db:migrate:remote
npm run db:seed:remote
```

---

## Troubleshooting

**`Error: Unsupported platform: win32 ia32 LE`**
You're on 32-bit Node. Install 64-bit Node 22 LTS and reinstall. See the Prerequisites section.

**`Profile not found. Run the seed migration.`**
You haven't applied the seed. Run `npm run db:seed:local` (and `:remote` after first deploy).

**`SESSION_SECRET is not set.`**
You're missing `.dev.vars` locally, or the wrangler secret in production. See sections 2 and 5.

**Login loops back to /admin/login**
Cookie can't be set because `SESSION_SECRET` is wrong/missing or the cookie is being blocked. Make sure you opened the site over `http://localhost:5173` (not file://) and that cookies aren't disabled.
