-- Portfolio database schema for myportfoliodb (Cloudflare D1)
-- Run with: wrangler d1 migrations apply myportfoliodb --local
--           wrangler d1 migrations apply myportfoliodb --remote

CREATE TABLE IF NOT EXISTS profile (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  full_name       TEXT NOT NULL,
  title           TEXT NOT NULL,
  tagline         TEXT NOT NULL,
  summary         TEXT NOT NULL,
  location        TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  available       INTEGER NOT NULL DEFAULT 1,
  years_experience INTEGER NOT NULL DEFAULT 0,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS social_links (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  label       TEXT NOT NULL,
  url         TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS experience (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  company      TEXT NOT NULL,
  role         TEXT NOT NULL,
  location     TEXT,
  start_date   TEXT NOT NULL,  -- YYYY-MM
  end_date     TEXT,           -- YYYY-MM or NULL for present
  summary      TEXT,
  highlights   TEXT NOT NULL,  -- JSON array of strings
  technologies TEXT,           -- JSON array of strings
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS projects (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  title          TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  tagline        TEXT NOT NULL,
  description    TEXT NOT NULL,
  impact         TEXT,
  technologies   TEXT NOT NULL, -- JSON array
  repo_url       TEXT,
  demo_url       TEXT,
  featured       INTEGER NOT NULL DEFAULT 0,
  sort_order     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS skills (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  category     TEXT NOT NULL,
  name         TEXT NOT NULL,
  level        INTEGER,         -- 1-5 optional
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS education (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  institution  TEXT NOT NULL,
  degree       TEXT NOT NULL,
  location     TEXT,
  start_date   TEXT,
  end_date     TEXT,
  details      TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS certifications (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  issuer        TEXT NOT NULL,
  issued_date   TEXT NOT NULL,  -- YYYY-MM
  credential_id TEXT,
  url           TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS awards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  issuer      TEXT NOT NULL,
  date        TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  company    TEXT,
  subject    TEXT,
  message    TEXT NOT NULL,
  ip_hash    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_experience_sort   ON experience (sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects (featured, sort_order);
CREATE INDEX IF NOT EXISTS idx_skills_category   ON skills (category, sort_order);
CREATE INDEX IF NOT EXISTS idx_messages_created  ON contact_messages (created_at DESC);
