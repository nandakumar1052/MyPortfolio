# scripts/deploy.ps1
# ──────────────────────────────────────────────────────────────────────────────
# Walks you through a secure production deploy.
#
# Run from the project root with PowerShell:
#   .\scripts\deploy.ps1
#
# This script:
#   1. Verifies wrangler authentication
#   2. Applies D1 migrations to your prod database (idempotent)
#   3. Asks before re-seeding (DESTRUCTIVE if you already have prod data)
#   4. Sets all 4 secrets from .deploy-secrets.local
#   5. Verifies wrangler.jsonc no longer contains placeholders
#   6. Builds and deploys
#
# It will NOT:
#   - Log you into wrangler (run `npx wrangler login` first)
#   - Create or rotate your Gemini key or Turnstile keys
#   - Touch your domain DNS
#
# You'll be prompted to confirm before any destructive action.
# ──────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Say([string]$Msg, [string]$Color = 'Cyan') {
  Write-Host ""
  Write-Host "▸ $Msg" -ForegroundColor $Color
}
function Warn([string]$Msg)  { Write-Host "⚠  $Msg" -ForegroundColor Yellow }
function Fail([string]$Msg)  { Write-Host "✗  $Msg" -ForegroundColor Red; exit 1 }
function Ok([string]$Msg)    { Write-Host "✓  $Msg" -ForegroundColor Green }

function Confirm([string]$Question, [string]$Default = 'n') {
  $hint = if ($Default -eq 'y') { '[Y/n]' } else { '[y/N]' }
  $ans = Read-Host "$Question $hint"
  if (-not $ans) { $ans = $Default }
  return $ans -match '^[yY]'
}

# ────────────────────────────────────────────────────────────────────────────
# Step 1 — Sanity checks
# ────────────────────────────────────────────────────────────────────────────
Say "Pre-flight checks"

if (-not (Test-Path '.deploy-secrets.local')) {
  Fail ".deploy-secrets.local not found. This script needs it."
}
if (-not (Test-Path 'wrangler.jsonc')) { Fail 'wrangler.jsonc not found.' }

$arch = & node -p "process.arch"
if ($arch.Trim() -ne 'x64') {
  Fail "Node is $($arch.Trim()), not x64. Install Node 22 LTS x64."
}
Ok "Node $(& node -v) ($arch)"

# Parse .deploy-secrets.local
$secrets = @{}
Get-Content '.deploy-secrets.local' | ForEach-Object {
  if ($_ -match '^([A-Z_]+)=(.+)$') {
    $secrets[$Matches[1]] = $Matches[2].Trim()
  }
}
$required = @('ADMIN_PASSWORD','SESSION_SECRET','GEMINI_API_KEY','TURNSTILE_SITE_KEY','TURNSTILE_SECRET_KEY')
foreach ($k in $required) {
  if (-not $secrets.ContainsKey($k) -or $secrets[$k] -match 'PASTE|REPLACE') {
    Fail "$k is missing or still a placeholder in .deploy-secrets.local. Fill it in first."
  }
}
Ok ".deploy-secrets.local has all 5 values"

# Check wrangler.jsonc doesn't contain placeholders for the public site key
$wranglerCfg = Get-Content 'wrangler.jsonc' -Raw
if ($wranglerCfg -match 'REPLACE_ME_WITH_REAL_TURNSTILE_SITE_KEY') {
  Warn "wrangler.jsonc still has REPLACE_ME_WITH_REAL_TURNSTILE_SITE_KEY."
  Warn "Replace it with your real Turnstile site key:"
  Warn "    $($secrets['TURNSTILE_SITE_KEY'])"
  Warn "Then re-run this script."
  exit 1
}
Ok "wrangler.jsonc looks clean"

# ────────────────────────────────────────────────────────────────────────────
# Step 2 — Verify wrangler is logged in
# ────────────────────────────────────────────────────────────────────────────
Say "Verifying wrangler authentication"
$who = & npx wrangler whoami 2>&1 | Out-String
if ($who -match 'not authenticated') {
  Fail "Wrangler is not logged in. Run `npx wrangler login` first."
}
$who | Select-String -Pattern 'email|account' | ForEach-Object { Write-Host "  $_" }
if (-not (Confirm 'Is that the right Cloudflare account?' 'n')) {
  Fail "Aborting. Run `npx wrangler logout && npx wrangler login` to switch accounts."
}

# ────────────────────────────────────────────────────────────────────────────
# Step 3 — Migrate prod D1
# ────────────────────────────────────────────────────────────────────────────
Say "Applying D1 migrations to PRODUCTION (myportfoliodb)"
& npx wrangler d1 migrations apply myportfoliodb --remote
if ($LASTEXITCODE -ne 0) { Fail "Migrations failed." }
Ok "Schema is up to date"

# ────────────────────────────────────────────────────────────────────────────
# Step 4 — Seed prod (destructive — confirm)
# ────────────────────────────────────────────────────────────────────────────
Say "Seeding production data"
Warn "This DELETEs and re-inserts: profile, social_links, experience, projects,"
Warn "skills, education, certifications, awards."
Warn "It does NOT touch: contact_messages, tailored_resumes."
if (Confirm 'Re-seed production now?' 'n') {
  & npx wrangler d1 execute myportfoliodb --remote --file=./migrations/0002_seed.sql
  if ($LASTEXITCODE -ne 0) { Fail "Seed failed." }
  Ok "Seeded"
} else {
  Warn "Skipping seed. Your portfolio content must already be in prod D1 for the site to render."
}

# ────────────────────────────────────────────────────────────────────────────
# Step 5 — Set Worker secrets
# ────────────────────────────────────────────────────────────────────────────
Say "Setting Worker secrets"
function Put-Secret([string]$Name, [string]$Value) {
  Write-Host "  Setting $Name..." -NoNewline
  $Value | & npx wrangler secret put $Name 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Host " ✗ failed" -ForegroundColor Red; exit 1 }
  Write-Host " ✓" -ForegroundColor Green
}
Put-Secret 'SESSION_SECRET'        $secrets['SESSION_SECRET']
Put-Secret 'ADMIN_PASSWORD'        $secrets['ADMIN_PASSWORD']
Put-Secret 'GEMINI_API_KEY'        $secrets['GEMINI_API_KEY']
Put-Secret 'TURNSTILE_SECRET_KEY'  $secrets['TURNSTILE_SECRET_KEY']

Say "Verifying secrets are set"
& npx wrangler secret list

# ────────────────────────────────────────────────────────────────────────────
# Step 6 — Deploy
# ────────────────────────────────────────────────────────────────────────────
Say "Building + deploying"
& npm run deploy
if ($LASTEXITCODE -ne 0) { Fail "Deploy failed." }

Say "Done!" 'Green'
Write-Host ""
Write-Host "Next steps you do manually in the Cloudflare dashboard:" -ForegroundColor Cyan
Write-Host "  1. Workers & Pages → nanda-portfolio → Settings → Domains & Routes"
Write-Host "       Add Custom Domain: nandakumaronline.com"
Write-Host "       Add Custom Domain: www.nandakumaronline.com"
Write-Host "  2. Domain zone → Rules → Redirect Rules → Create"
Write-Host "       Redirect www.nandakumaronline.com → https://nandakumaronline.com (301)"
Write-Host "  3. Workers & Pages → nanda-portfolio → Settings → Rate Limiting"
Write-Host "       Add rule on POST /admin/login: 5 reqs / 1 min → Block 5 min"
Write-Host "  4. Once verified working, delete .deploy-secrets.local if you don't want it sitting around."
Write-Host ""
