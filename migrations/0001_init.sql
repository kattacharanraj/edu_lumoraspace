-- edu.lumoraspace.in — v0 schema
-- A course is a "product": the admin creates it, pastes a Google Form URL,
-- and publishes it. The public site renders it and the Register button
-- redirects to that form. No student accounts in v0.

DROP TABLE IF EXISTS courses;
CREATE TABLE courses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT    NOT NULL UNIQUE,
  title         TEXT    NOT NULL,
  summary       TEXT    NOT NULL DEFAULT '',
  description   TEXT    NOT NULL DEFAULT '',
  category      TEXT    NOT NULL DEFAULT 'General',
  level         TEXT    NOT NULL DEFAULT 'Beginner',
  mode          TEXT    NOT NULL DEFAULT 'Online',
  duration      TEXT    NOT NULL DEFAULT '',
  schedule      TEXT    NOT NULL DEFAULT '',
  price_label   TEXT    NOT NULL DEFAULT 'Free',
  start_label   TEXT    NOT NULL DEFAULT '',
  seats_label   TEXT    NOT NULL DEFAULT '',
  image_url     TEXT    NOT NULL DEFAULT '',
  -- JSON arrays, stored as text
  highlights    TEXT    NOT NULL DEFAULT '[]',   -- ["What you get", ...]
  curriculum    TEXT    NOT NULL DEFAULT '[]',   -- [{"title":"Module 1","detail":"..."}]
  tags          TEXT    NOT NULL DEFAULT '[]',   -- ["Python","Pandas"]
  -- the Google Form the "Register Now" button opens
  register_url  TEXT    NOT NULL DEFAULT '',
  published     INTEGER NOT NULL DEFAULT 0,
  featured      INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_courses_published ON courses (published, sort_order, id);
CREATE INDEX idx_courses_category  ON courses (category);

-- Throttles admin sign-in so a leaked URL cannot be brute forced.
DROP TABLE IF EXISTS login_attempts;
CREATE TABLE login_attempts (
  ip        TEXT PRIMARY KEY,
  fails     INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,  -- epoch ms
  updated_at   INTEGER NOT NULL DEFAULT 0
);
