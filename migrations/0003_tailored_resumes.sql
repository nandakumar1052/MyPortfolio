-- Tailored resume variants generated for specific job descriptions.
-- The base (generic) resume continues to live across the existing tables;
-- these rows are independent role-specific copies stored as markdown.

CREATE TABLE IF NOT EXISTS tailored_resumes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  job_title       TEXT NOT NULL,
  company         TEXT,
  job_description TEXT NOT NULL,
  markdown        TEXT NOT NULL,
  ai_model        TEXT,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tailored_resumes_created
  ON tailored_resumes (created_at DESC);
