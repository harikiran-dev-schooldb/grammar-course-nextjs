import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { auth, neonConfigured } from "@/lib/auth-server";
import { CloudProgress, defaultPreferences, emptyProgress } from "@/lib/progress";
import { parseDailyTestRecords } from "@/lib/daily-test-core";

const databaseConfigured = () => Boolean(process.env.DATABASE_URL);

async function userSession() {
  if (!neonConfigured) return null;
  const { data } = await auth.getSession();
  return data?.user || null;
}

async function ensureTable() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`CREATE TABLE IF NOT EXISTS learner_progress (
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
    reading_coach_results JSONB NOT NULL DEFAULT '[]'::jsonb,
    study_minutes JSONB NOT NULL DEFAULT '{}'::jsonb,
    daily_tests JSONB NOT NULL DEFAULT '{}'::jsonb,
    conversation_days JSONB NOT NULL DEFAULT '[]'::jsonb,
    word_days JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS pronunciation_results JSONB NOT NULL DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS reading_coach_results JSONB NOT NULL DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS study_minutes JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS daily_tests JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS conversation_days JSONB NOT NULL DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS word_days JSONB NOT NULL DEFAULT '[]'::jsonb`;
  return sql;
}

function cleanProgress(value: Partial<CloudProgress>, fallbackName: string): CloudProgress {
  const cleanNumbers = (input: unknown) => Array.isArray(input) ? input.filter((item): item is number => Number.isInteger(item) && item >= 1 && item <= 30) : [];
  // The complete course now contains 120 library lessons in addition to the
  // guided activities, so keep enough completion IDs to preserve full mastery.
  const cleanStrings = (input: unknown, limit = 500) => Array.isArray(input) ? input.filter((item): item is string => typeof item === "string").slice(-limit) : [];
  const writings = value.writings && typeof value.writings === "object" ? Object.fromEntries(Object.entries(value.writings).filter(([, text]) => typeof text === "string").map(([day, text]) => [day.slice(0, 8), text.slice(0, 3000)]).slice(-30)) : {};
  const mistakes = Array.isArray(value.mistakes) ? value.mistakes.filter((item) => item && typeof item.id === "string" && typeof item.prompt === "string").slice(-100) : [];
  const rawPreferences = value.preferences && typeof value.preferences === "object" ? value.preferences : defaultPreferences;
  const placementLevel = ["beginner", "everyday", "confident"].includes(String(rawPreferences.placementLevel)) ? rawPreferences.placementLevel : null;
  const readingLevel = ["pre-reader", "word-reader", "sentence-reader"].includes(String(rawPreferences.readingLevel)) ? rawPreferences.readingLevel : null;
  const ageMode = ["kids", "teens", "adults"].includes(String(rawPreferences.ageMode)) ? rawPreferences.ageMode as "kids" | "teens" | "adults" : "kids";
  const pronunciationResults = Array.isArray(value.pronunciationResults) ? value.pronunciationResults.filter((item) => item && Number.isInteger(item.day) && item.day >= 1 && item.day <= 30 && Number.isFinite(item.score) && typeof item.transcript === "string").map((item) => ({ day: item.day, score: Math.max(0, Math.min(100, Math.round(item.score))), transcript: item.transcript.slice(0, 500), updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString() })).slice(-30) : [];
  const readingCoachResults = Array.isArray(value.readingCoachResults) ? value.readingCoachResults.filter((item) => item && typeof item.passageId === "string" && Number.isFinite(item.accuracy) && Number.isFinite(item.wordsPerMinute)).map((item) => ({ passageId: item.passageId.slice(0, 50), accuracy: Math.max(0, Math.min(100, Math.round(item.accuracy))), wordsPerMinute: Math.max(0, Math.min(300, Math.round(item.wordsPerMinute))), missedWords: cleanStrings(item.missedWords, 30).map((word) => word.slice(0, 40)), transcript: typeof item.transcript === "string" ? item.transcript.slice(0, 1500) : "", updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString() })).slice(-30) : [];
  const studyMinutes = value.studyMinutes && typeof value.studyMinutes === "object" ? Object.fromEntries(Object.entries(value.studyMinutes).filter(([date, minutes]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && typeof minutes === "number" && Number.isFinite(minutes)).map(([date, minutes]) => [date, Math.max(0, Math.min(1440, Math.round(minutes)))]).slice(-90)) : {};
  const dailyTests = parseDailyTestRecords(JSON.stringify(value.dailyTests || {}), Array.from({ length: 30 }, (_, index) => index + 1));
  return {
    displayName: typeof value.displayName === "string" ? value.displayName.trim().slice(0, 80) || fallbackName : fallbackName,
    completed: cleanNumbers(value.completed),
    currentDay: Number.isInteger(value.currentDay) ? Math.min(30, Math.max(1, Number(value.currentDay))) : 1,
    skillsDone: cleanStrings(value.skillsDone),
    writings,
    mistakes,
    activityDates: cleanStrings(value.activityDates, 90),
    badges: cleanStrings(value.badges, 30),
    preferences: {
      placementLevel,
      dailyGoalMinutes: [10, 15, 20, 30].includes(Number(rawPreferences.dailyGoalMinutes)) ? Number(rawPreferences.dailyGoalMinutes) : 15,
      reminderTime: typeof rawPreferences.reminderTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(rawPreferences.reminderTime) ? rawPreferences.reminderTime : "19:00",
      remindersEnabled: rawPreferences.remindersEnabled === true,
      readingLevel,
      ageMode,
    },
    pronunciationResults,
    readingCoachResults,
    studyMinutes,
    dailyTests,
    conversationDays: cleanNumbers(value.conversationDays),
    wordDays: cleanNumbers(value.wordDays),
  };
}

export async function GET() {
  if (!databaseConfigured()) return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  const user = await userSession();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const sql = await ensureTable();
  const rows = await sql`SELECT display_name, completed, current_day, skills_done, writings, mistakes, activity_dates, badges, preferences, pronunciation_results, reading_coach_results, study_minutes, daily_tests, conversation_days, word_days FROM learner_progress WHERE user_id = ${user.id}`;
  if (!rows[0]) return NextResponse.json(emptyProgress(user.name || "Learner"));
  const row = rows[0];
  return NextResponse.json(cleanProgress({
    displayName: row.display_name as string,
    completed: row.completed as number[],
    currentDay: row.current_day as number,
    skillsDone: row.skills_done as string[],
    writings: row.writings as Record<string, string>,
    mistakes: row.mistakes as CloudProgress["mistakes"],
    activityDates: row.activity_dates as string[],
    badges: row.badges as string[],
    preferences: row.preferences as CloudProgress["preferences"],
    pronunciationResults: row.pronunciation_results as CloudProgress["pronunciationResults"],
    readingCoachResults: row.reading_coach_results as CloudProgress["readingCoachResults"],
    studyMinutes: row.study_minutes as CloudProgress["studyMinutes"],
    dailyTests: row.daily_tests as CloudProgress["dailyTests"],
    conversationDays: row.conversation_days as number[],
    wordDays: row.word_days as number[],
  }, user.name || "Learner"));
}

export async function POST(request: Request) {
  if (!databaseConfigured()) return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  const user = await userSession();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const progress = cleanProgress(await request.json(), user.name || "Learner");
  const sql = await ensureTable();
  await sql`INSERT INTO learner_progress (user_id, display_name, completed, current_day, skills_done, writings, mistakes, activity_dates, badges, preferences, pronunciation_results, reading_coach_results, study_minutes, daily_tests, conversation_days, word_days, updated_at)
    VALUES (${user.id}, ${progress.displayName}, ${JSON.stringify(progress.completed)}, ${progress.currentDay}, ${JSON.stringify(progress.skillsDone)}, ${JSON.stringify(progress.writings)}, ${JSON.stringify(progress.mistakes)}, ${JSON.stringify(progress.activityDates)}, ${JSON.stringify(progress.badges)}, ${JSON.stringify(progress.preferences)}, ${JSON.stringify(progress.pronunciationResults)}, ${JSON.stringify(progress.readingCoachResults)}, ${JSON.stringify(progress.studyMinutes)}, ${JSON.stringify(progress.dailyTests)}, ${JSON.stringify(progress.conversationDays)}, ${JSON.stringify(progress.wordDays)}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, completed = EXCLUDED.completed, current_day = EXCLUDED.current_day, skills_done = EXCLUDED.skills_done, writings = EXCLUDED.writings, mistakes = EXCLUDED.mistakes, activity_dates = EXCLUDED.activity_dates, badges = EXCLUDED.badges, preferences = EXCLUDED.preferences, pronunciation_results = EXCLUDED.pronunciation_results, reading_coach_results = EXCLUDED.reading_coach_results, study_minutes = EXCLUDED.study_minutes, daily_tests = EXCLUDED.daily_tests, conversation_days = EXCLUDED.conversation_days, word_days = EXCLUDED.word_days, updated_at = NOW()`;
  return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
}
