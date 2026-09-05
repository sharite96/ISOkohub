-- ============================================================
-- IsokoHub - Authentication Migration
-- Cloudflare D1 / SQLite
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- USERS: authentication/session fields
-- ------------------------------------------------------------

-- Add password hash if the old database does not have it.
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Add session token hash for logged-in users.
ALTER TABLE users ADD COLUMN session_token_hash TEXT;

-- Add account status.
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- ------------------------------------------------------------
-- REVIEWS
-- ------------------------------------------------------------

-- Backend uses "comment" when creating reviews.
ALTER TABLE reviews ADD COLUMN comment TEXT;

-- Review moderation status.
ALTER TABLE reviews ADD COLUMN status TEXT NOT NULL DEFAULT 'published';

-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_session_token
ON users(session_token_hash);

CREATE INDEX IF NOT EXISTS idx_users_status
ON users(status);

CREATE INDEX IF NOT EXISTS idx_reviews_status
ON reviews(status);

-- ============================================================
-- END IsokoHub AUTH MIGRATION
-- ============================================================
