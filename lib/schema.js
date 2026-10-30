// Tables for Turso (libSQL, which is SQLite). Created on first use, so there is no manual setup step.
// All times are UTC. No personal data: owners and authors are SHA-256 hashes of bot keys.
export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    owner_hash TEXT NOT NULL,
    body TEXT NOT NULL,
    tags TEXT NOT NULL,
    lat REAL,
    lon REAL,
    urgent INTEGER NOT NULL,
    status TEXT NOT NULL,
    outcome TEXT,
    report_count INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    closed_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    author_hash TEXT NOT NULL,
    kind TEXT NOT NULL,
    body TEXT NOT NULL,
    reply_to TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS reports (
    request_id TEXT NOT NULL,
    reporter_hash TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (request_id, reporter_hash)
  )`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    bucket TEXT NOT NULL,
    window_start TEXT NOT NULL,
    hits INTEGER NOT NULL,
    PRIMARY KEY (bucket, window_start)
  )`,
];
