CREATE TABLE IF NOT EXISTS learner_progress (
  user_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  completed JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_day INTEGER NOT NULL DEFAULT 1,
  skills_done JSONB NOT NULL DEFAULT '[]'::jsonb,
  writings JSONB NOT NULL DEFAULT '{}'::jsonb,
  mistakes JSONB NOT NULL DEFAULT '[]'::jsonb,
  activity_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  pronunciation_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  study_minutes JSONB NOT NULL DEFAULT '{}'::jsonb,
  daily_tests JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
