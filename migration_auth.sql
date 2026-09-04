-- Run after schema.sql if your existing database was created from an older version.
-- These statements are safe to run only when the columns do not already exist.
-- If a column already exists, skip that individual statement.
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN session_token_hash TEXT;
