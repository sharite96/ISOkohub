-- =========================================================
-- ISOKOHUB AUTHENTICATION MIGRATION
-- Cloudflare D1 / SQLite
-- =========================================================

PRAGMA foreign_keys = ON;

-- =========================================================
-- AUTH SESSIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS auth_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    session_token TEXT NOT NULL UNIQUE,

    expires_at TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- EMAIL VERIFICATION
-- =========================================================

CREATE TABLE IF NOT EXISTS email_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    verification_token TEXT NOT NULL UNIQUE,

    expires_at TEXT NOT NULL,

    verified_at TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- PASSWORD RESET
-- =========================================================

CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    reset_token TEXT NOT NULL UNIQUE,

    expires_at TEXT NOT NULL,

    used_at TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- LOGIN ATTEMPTS
-- =========================================================

CREATE TABLE IF NOT EXISTS login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER,

    email TEXT,

    success INTEGER NOT NULL DEFAULT 0,

    ip_hash TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- =========================================================
-- USER PROFILE
-- =========================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL UNIQUE,

    first_name TEXT,

    last_name TEXT,

    bio TEXT,

    avatar_url TEXT,

    address TEXT,

    district TEXT,

    city TEXT,

    country TEXT DEFAULT 'Rwanda',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================
-- AUTH INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
ON auth_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token
ON auth_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry
ON auth_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user
ON email_verifications(user_id);

CREATE INDEX IF NOT EXISTS idx_email_verifications_token
ON email_verifications(verification_token);

CREATE INDEX IF NOT EXISTS idx_password_resets_user
ON password_resets(user_id);

CREATE INDEX IF NOT EXISTS idx_password_resets_token
ON password_resets(reset_token);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email
ON login_attempts(email);

CREATE INDEX IF NOT EXISTS idx_login_attempts_user
ON login_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user
ON user_profiles(user_id);

-- =========================================================
-- CLEAN EXPIRED AUTH DATA
-- =========================================================

DELETE FROM auth_sessions
WHERE expires_at < CURRENT_TIMESTAMP;

DELETE FROM email_verifications
WHERE expires_at < CURRENT_TIMESTAMP
AND verified_at IS NULL;

DELETE FROM password_resets
WHERE expires_at < CURRENT_TIMESTAMP
AND used_at IS NULL;

-- =========================================================
-- DONE
-- =========================================================
