import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { auth, neonConfigured } from "@/lib/auth-server";
import { CloudProgress, emptyProgress } from "@/lib/progress";

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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  return sql;
}

function cleanProgress(value: Partial<CloudProgress>, fallbackName: string): CloudProgress {
  const cleanNumbers = (input: unknown) => Array.isArray(input) ? input.filter((item): item is number => Number.isInteger(item) && item >= 1 && item <= 30) : [];
  const cleanStrings = (input: unknown, limit = 150) => Array.isArray(input) ? input.filter((item): item is string => typeof item === "string").slice(-limit) : [];
  const writings = value.writings && typeof value.writings === "object" ? Object.fromEntries(Object.entries(value.writings).filter(([, text]) => typeof text === "string").map(([day, text]) => [day.slice(0, 8), text.slice(0, 3000)]).slice(-30)) : {};
  const mistakes = Array.isArray(value.mistakes) ? value.mistakes.filter((item) => item && typeof item.id === "string" && typeof item.prompt === "string").slice(-100) : [];
  return {
    displayName: typeof value.displayName === "string" ? value.displayName.trim().slice(0, 80) || fallbackName : fallbackName,
    completed: cleanNumbers(value.completed),
    currentDay: Number.isInteger(value.currentDay) ? Math.min(30, Math.max(1, Number(value.currentDay))) : 1,
    skillsDone: cleanStrings(value.skillsDone),
    writings,
    mistakes,
    activityDates: cleanStrings(value.activityDates, 90),
    badges: cleanStrings(value.badges, 30),
  };
}

export async function GET() {
  if (!databaseConfigured()) return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  const user = await userSession();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const sql = await ensureTable();
  const rows = await sql`SELECT display_name, completed, current_day, skills_done, writings, mistakes, activity_dates, badges FROM learner_progress WHERE user_id = ${user.id}`;
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
  }, user.name || "Learner"));
}

export async function POST(request: Request) {
  if (!databaseConfigured()) return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  const user = await userSession();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const progress = cleanProgress(await request.json(), user.name || "Learner");
  const sql = await ensureTable();
  await sql`INSERT INTO learner_progress (user_id, display_name, completed, current_day, skills_done, writings, mistakes, activity_dates, badges, updated_at)
    VALUES (${user.id}, ${progress.displayName}, ${JSON.stringify(progress.completed)}, ${progress.currentDay}, ${JSON.stringify(progress.skillsDone)}, ${JSON.stringify(progress.writings)}, ${JSON.stringify(progress.mistakes)}, ${JSON.stringify(progress.activityDates)}, ${JSON.stringify(progress.badges)}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, completed = EXCLUDED.completed, current_day = EXCLUDED.current_day, skills_done = EXCLUDED.skills_done, writings = EXCLUDED.writings, mistakes = EXCLUDED.mistakes, activity_dates = EXCLUDED.activity_dates, badges = EXCLUDED.badges, updated_at = NOW()`;
  return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
}
