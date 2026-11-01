-- Username alias mapping: Neon Auth still handles password verification.
CREATE TABLE IF NOT EXISTS learner_usernames (
 username TEXT PRIMARY KEY,
 user_id TEXT NOT NULL UNIQUE,
 recovery_email TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT valid_learner_username CHECK (username ~ '^[a-z0-9_]{3,30}$')
);
CREATE TABLE IF NOT EXISTS learner_reset_throttle (username TEXT PRIMARY KEY, last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
