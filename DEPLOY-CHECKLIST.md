# Deploy checklist — nandakumaronline.com

I've done everything I can do locally. Below is the list of things only you can do — they all need either your Cloudflare account, your Google account, or your domain registrar.

Work top to bottom, one section at a time. Don't skip ahead.

---

## ✅ Already done for you

- Fresh `ADMIN_PASSWORD` (32 chars, base64url) generated and stored in `.deploy-secrets.local`
- Fresh `SESSION_SECRET` (64 hex chars) generated and stored in `.deploy-secrets.local`
- `.dev.vars` updated to mirror the new credentials so local dev keeps working
- `.gitignore` updated to exclude `.deploy-secrets.local` and `backups/`
- `wrangler.jsonc` cleaned up — placeholder `vars` removed, real `vars` added with `TURNSTILE_SITE_KEY` placeholder + `GEMINI_MODEL`
- Production build verified locally (`npm run build` — 1.6 MB server bundle, well under limit)
- Local D1 backup saved in `backups/local-baseline-*.sql`
- One-shot deploy script written at `scripts/deploy.ps1` (handles migrate + secrets + deploy)

---

## 🔧 You do (~30 min, in order)

### 1. Rotate the leaked Gemini API key

The key you pasted in chat is compromised. Do not skip this.

1. Open https://aistudio.google.com/app/apikey
2. Find the existing key, click the trash icon → **Delete**
3. Click **Create API key** → copy the new value
4. Open `.deploy-secrets.local` in your editor
5. Replace `__PASTE_NEW_KEY_AFTER_REVOKING_OLD_ONE__` with the new key
6. Also update `.dev.vars` line 25 with the new key so local dev keeps working

### 2. Create real Cloudflare Turnstile keys

1. Open https://dash.cloudflare.com/?to=/:account/turnstile
2. Click **Add site**
3. Fill in:
   - **Site name:** `portfolio`
   - **Hostnames:** add three rows:
     - `nandakumaronline.com`
     - `www.nandakumaronline.com`
     - (temporarily keep `*.workers.dev` so you can test before DNS flips)
   - **Widget mode:** **Managed**
4. Click **Create**
5. You'll see two keys. Open `.deploy-secrets.local` and replace:
   - `TURNSTILE_SITE_KEY=...` with the **Site Key** (top one, starts with `0x4AAA...`)
   - `TURNSTILE_SECRET_KEY=...` with the **Secret Key** (bottom one)
6. **Also update `wrangler.jsonc`** line 13 — replace `REPLACE_ME_WITH_REAL_TURNSTILE_SITE_KEY` with the same Site Key

### 3. Get your domain onto Cloudflare DNS

> Skip this section if `nandakumaronline.com` is already in your Cloudflare account.

1. Open https://dash.cloudflare.com and click **Add a site** at the top
2. Enter `nandakumaronline.com` → **Continue** → pick the **Free** plan
3. Cloudflare auto-scans existing DNS records. **Before clicking Continue:**
   - Verify any MX records (email — Google Workspace, etc.) are present
   - Verify any TXT records (SPF, DKIM, domain verification) are present
   - If any are missing, add them manually so email and other services keep working
4. Cloudflare gives you two nameservers like `walt.ns.cloudflare.com` and `lily.ns.cloudflare.com`
5. Go to the registrar where you bought `nandakumaronline.com` (GoDaddy, Namecheap, etc.)
6. Find DNS / Nameserver settings → replace the existing nameservers with the two Cloudflare gave you → save
7. Propagation takes 10 min – a few hours. Cloudflare emails you when it's done. The rest of this checklist can wait — go grab coffee.

### 4. Authenticate Wrangler with your Cloudflare account

```powershell
cd D:\Projects\MyPortfolio
npx wrangler login
```

A browser tab opens → click **Allow** → success page appears → close the tab.

Verify:

```powershell
npx wrangler whoami
```

Should show your Cloudflare email + account ID. Make sure it's the account that owns `myportfoliodb`.

### 5. Run the deploy script

```powershell
.\scripts\deploy.ps1
```

The script will:
- Verify your Node version, wrangler auth, and `.deploy-secrets.local`
- Apply D1 migrations to your production database (idempotent — safe)
- **Ask** before re-seeding production data (DESTRUCTIVE — say yes the first time, no after)
- Set all 4 secrets in your Worker
- Build + deploy

At the end it prints your live `*.workers.dev` URL.

### 6. Smoke-test the workers.dev URL FIRST

Before attaching the custom domain, verify the bare deploy works:

1. Open `https://nanda-portfolio.<your-cf-subdomain>.workers.dev/`
2. Click around — home, projects, resume
3. Click **Download .docx** — should give you a Word file
4. Open `/admin/login` → log in with the password from `.deploy-secrets.local` line 6
5. Try `/admin/resume/tailored/new` → paste any short JD → verify Gemini generates a resume + cover letter
6. Try `/contact` → check the Turnstile widget appears + the form submits

If everything works here, proceed. If not, fix before adding the custom domain.

### 7. Attach `nandakumaronline.com` to the Worker

Wait until step 3's nameserver propagation is done (check the Cloudflare dashboard — the site shows as "Active").

1. Dashboard → **Workers & Pages** → **`nanda-portfolio`**
2. **Settings** tab → **Domains & Routes** section → **Add → Custom Domain**
3. Enter `nandakumaronline.com` → **Add Domain**
4. Wait ~60 seconds for the SSL cert provisioning indicator to turn green
5. Repeat for `www.nandakumaronline.com`

### 8. Redirect www to apex

1. Cloudflare dashboard → click into the `nandakumaronline.com` zone (not the Worker)
2. Left sidebar → **Rules** → **Redirect Rules** → **Create rule**
3. Configure:
   - **Rule name:** `www-to-apex`
   - **When incoming requests match:** `Hostname` `equals` `www.nandakumaronline.com`
   - **Then:**
     - **Type:** Dynamic
     - **Expression:** `concat("https://nandakumaronline.com", http.request.uri.path)`
     - **Status code:** `301`
     - **Preserve query string:** checked
4. **Deploy**

### 9. Add the admin-login rate-limit rule

1. Dashboard → **Workers & Pages** → **`nanda-portfolio`** → **Settings** → **Rate Limiting**
2. **Add rule**
3. Configure:
   - **Name:** `admin-login-bruteforce`
   - **When:** `URI Path equals /admin/login` AND `Request Method equals POST`
   - **Then:** `Block` for `5 minutes`
   - **Threshold:** `5 requests per 1 minute`
4. **Save**

### 10. Tighten SSL settings

1. Cloudflare dashboard → `nandakumaronline.com` zone → **SSL/TLS** → **Edge Certificates**
2. Verify:
   - **Always Use HTTPS:** On
   - **Automatic HTTPS Rewrites:** On
   - **Minimum TLS Version:** 1.2
   - **Opportunistic Encryption:** On

### 11. Smoke-test the live domain

```powershell
# DNS resolves
nslookup nandakumaronline.com

# HTTPS works
curl -I https://nandakumaronline.com/

# Worker is responding
curl -s https://nandakumaronline.com/ | Select-String -Pattern "Nanda Kumar"

# Security headers are present
curl -I https://nandakumaronline.com/ | Select-String -Pattern "content-security|strict-transport"

# www → apex redirect works
curl -I https://www.nandakumaronline.com/
# expect: HTTP/2 301, location: https://nandakumaronline.com/
```

Then in a browser, signed-out:

| URL | Verify |
|---|---|
| `https://nandakumaronline.com` | Home page loads |
| `https://nandakumaronline.com/resume.docx` | Word file downloads |
| `https://nandakumaronline.com/contact` | Turnstile widget appears + form submits |
| `https://nandakumaronline.com/admin/login` | Login form loads + your new password works |

Sign in, then try the AI tailoring flow at `/admin/resume/tailored/new` end-to-end.

### 12. Final lock-down

Once steps 1–11 are all green:

1. **Turnstile dashboard** → your `portfolio` site → **Settings** → **Hostnames** → **remove** `*.workers.dev`. Captcha will only validate from your real domain now.
2. **Securely store** the values from `.deploy-secrets.local` in a password manager:
   - `ADMIN_PASSWORD` (you'll need this to log into `/admin/login` forever)
   - `SESSION_SECRET` (only needed if you ever want to deploy from another machine)
   - `GEMINI_API_KEY` (only needed if you set up CI/CD later)
3. **Delete `.deploy-secrets.local`**: `Remove-Item .deploy-secrets.local`
4. **Update your LinkedIn / GitHub bio / email signature** with `nandakumaronline.com`

---

## 🆘 If something breaks

| Symptom | Look here |
|---|---|
| `wrangler login` browser tab gets stuck | Open `https://dash.cloudflare.com` in another tab first to confirm you're signed in, then retry |
| Deploy script says "wrangler.jsonc still has REPLACE_ME..." | You forgot step 2 line 6 — update `wrangler.jsonc` with your Turnstile Site Key |
| Admin login loops back to login | `SESSION_SECRET` mismatch — re-run `npx wrangler secret put SESSION_SECRET` and paste the value from `.deploy-secrets.local` |
| Contact form rejects all captchas | Hostname missing from Turnstile config — re-add `nandakumaronline.com` to your Turnstile site hostnames |
| Tailored resume create returns "GEMINI_API_KEY is not set" | `npx wrangler secret put GEMINI_API_KEY`, paste the new key, then `npm run deploy` |
| Custom domain stuck on "Pending SSL" | Wait 5 min and refresh. If still stuck after an hour, remove and re-add. |

---

## ⏱️ Time estimate

- Steps 1–2 (rotate keys): 5 min
- Step 3 (DNS / nameservers): 5 min of work, then up to a few hours of waiting
- Step 4 (wrangler login): 1 min
- Step 5 (deploy script): ~2 min runtime
- Step 6 (workers.dev smoke test): 5 min
- Steps 7–10 (custom domain + redirects + rate limit + SSL): 10 min
- Step 11 (final smoke test): 5 min
- Step 12 (lock-down): 5 min

**Total active work: ~35 minutes** + DNS propagation wait.
