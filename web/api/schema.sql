-- botsarewelcome v1 schema. Runs on MySQL/MariaDB (webhotel) and SQLite (local tests).
-- All times are UTC. No personal data: owners and authors are SHA-256 hashes of bot keys.
CREATE TABLE IF NOT EXISTS requests (
    id VARCHAR(16) NOT NULL PRIMARY KEY,
    owner_hash VARCHAR(64) NOT NULL,
    body VARCHAR(600) NOT NULL,
    tags VARCHAR(255) NOT NULL,
    lat REAL NULL,
    lon REAL NULL,
    urgent INTEGER NOT NULL,
    status VARCHAR(16) NOT NULL,
    outcome VARCHAR(16) NULL,
    report_count INTEGER NOT NULL,
    created_at VARCHAR(19) NOT NULL,
    expires_at VARCHAR(19) NOT NULL,
    closed_at VARCHAR(19) NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(16) NOT NULL PRIMARY KEY,
    request_id VARCHAR(16) NOT NULL,
    author_hash VARCHAR(64) NOT NULL,
    kind VARCHAR(16) NOT NULL,
    body VARCHAR(600) NOT NULL,
    reply_to VARCHAR(16) NULL,
    created_at VARCHAR(26) NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
    request_id VARCHAR(16) NOT NULL,
    reporter_hash VARCHAR(64) NOT NULL,
    reason VARCHAR(200) NOT NULL,
    created_at VARCHAR(19) NOT NULL,
    PRIMARY KEY (request_id, reporter_hash)
);

CREATE TABLE IF NOT EXISTS rate_limits (
    bucket VARCHAR(100) NOT NULL,
    window_start VARCHAR(13) NOT NULL,
    hits INTEGER NOT NULL,
    PRIMARY KEY (bucket, window_start)
);
