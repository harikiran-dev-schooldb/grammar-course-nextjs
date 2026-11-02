import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { auth, neonConfigured } from "@/lib/auth-server";
import { CloudProgress, defaultPreferences, emptyProgress } from "@/lib/progress";

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
    study_minutes JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS pronunciation_results JSONB NOT NULL DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE learner_progress ADD COLUMN IF NOT EXISTS study_minutes JSONB NOT NULL DEFAULT '{}'::jsonb`;
  return sql;
}

function cleanProgress(value: Partial<CloudProgress>, fallbackName: string): CloudProgress {
  const cleanNumbers = (input: unknown) => Array.isArray(input) ? input.filter((item): item is number => Number.isInteger(item) && item >= 1 && item <= 30) : [];
  const cleanStrings = (input: unknown, limit = 150) => Array.isArray(input) ? input.filter((item): item is string => typeof item === "string").slice(-limit) : [];
  const writings = value.writings && typeof value.writings === "object" ? Object.fromEntries(Object.entries(value.writings).filter(([, text]) => typeof text === "string").map(([day, text]) => [day.slice(0, 8), text.slice(0, 3000)]).slice(-30)) : {};
  const mistakes = Array.isArray(value.mistakes) ? value.mistakes.filter((item) => item && typeof item.id === "string" && typeof item.prompt === "string").slice(-100) : [];
  const rawPreferences = value.preferences && typeof value.preferences === "object" ? value.preferences : defaultPreferences;
  const placementLevel = ["beginner", "everyday", "confident"].includes(String(rawPreferences.placementLevel)) ? rawPreferences.placementLevel : null;
  const pronunciationResults = Array.isArray(value.pronunciationResults) ? value.pronunciationResults.filter((item) => item && Number.isInteger(item.day) && item.day >= 1 && item.day <= 30 && Number.isFinite(item.score) && typeof item.transcript === "string").map((item) => ({ day: item.day, score: Math.max(0, Math.min(100, Math.round(item.score))), transcript: item.transcript.slice(0, 500), updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString() })).slice(-30) : [];
  const studyMinutes = value.studyMinutes && typeof value.studyMinutes === "object" ? Object.fromEntries(Object.entries(value.studyMinutes).filter(([date, minutes]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && typeof minutes === "number" && Number.isFinite(minutes)).map(([date, minutes]) => [date, Math.max(0, Math.min(1440, Math.round(minutes)))]).slice(-90)) : {};
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
    },
    pronunciationResults,
    studyMinutes,
  };
}

export async function GET() {
  if (!databaseConfigured()) return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  const user = await userSession();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const sql = await ensureTable();
  const rows = await sql`SELECT display_name, completed, current_day, skills_done, writings, mistakes, activity_dates, badges, preferences, pronunciation_results, study_minutes FROM learner_progress WHERE user_id = ${user.id}`;
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
    studyMinutes: row.study_minutes as CloudProgress["studyMinutes"],
  }, user.name || "Learner"));
}

export async function POST(request: Request) {
  if (!databaseConfigured()) return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  const user = await userSession();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const progress = cleanProgress(await request.json(), user.name || "Learner");
  const sql = await ensureTable();
  await sql`INSERT INTO learner_progress (user_id, display_name, completed, current_day, skills_done, writings, mistakes, activity_dates, badges, preferences, pronunciation_results, study_minutes, updated_at)
    VALUES (${user.id}, ${progress.displayName}, ${JSON.stringify(progress.completed)}, ${progress.currentDay}, ${JSON.stringify(progress.skillsDone)}, ${JSON.stringify(progress.writings)}, ${JSON.stringify(progress.mistakes)}, ${JSON.stringify(progress.activityDates)}, ${JSON.stringify(progress.badges)}, ${JSON.stringify(progress.preferences)}, ${JSON.stringify(progress.pronunciationResults)}, ${JSON.stringify(progress.studyMinutes)}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, completed = EXCLUDED.completed, current_day = EXCLUDED.current_day, skills_done = EXCLUDED.skills_done, writings = EXCLUDED.writings, mistakes = EXCLUDED.mistakes, activity_dates = EXCLUDED.activity_dates, badges = EXCLUDED.badges, preferences = EXCLUDED.preferences, pronunciation_results = EXCLUDED.pronunciation_results, study_minutes = EXCLUDED.study_minutes, updated_at = NOW()`;
  return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
}
