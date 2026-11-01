/** Offline daily-test scoring and saved-results validation. */
export type TestQuestion = {
  id: string;
  day: number;
  prompt: string;
  promptTe: string;
  options: readonly string[];
  answer: number;
  explanation: string;
  explanationTe: string;
};
export type DailyTestRecord = {
  day: number;
  attempts: number;
  latestScore: number;
  bestScore: number;
  totalQuestions: number;
  incorrectIds: string[];
  updatedAt: number;
};
export type DailyTestRecords = Record<number, DailyTestRecord>;
export const PASS_PERCENT = 80;

export function percent(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

export function parseDailyTestRecords(raw: string | null, validDays: readonly number[]): DailyTestRecords {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: DailyTestRecords = {};
    for (const [key, value] of Object.entries(parsed)) {
      const day = Number(key);
      if (!validDays.includes(day) || !value || typeof value !== "object") continue;
      const item = value as Partial<DailyTestRecord>;
      if (!Number.isInteger(item.attempts) || !item.attempts || item.attempts < 1 ||
          !Number.isInteger(item.totalQuestions) || !item.totalQuestions || item.totalQuestions < 1 ||
          !Number.isInteger(item.latestScore) || item.latestScore! < 0 || item.latestScore! > item.totalQuestions ||
          !Number.isInteger(item.bestScore) || item.bestScore! < 0 || item.bestScore! > item.totalQuestions ||
          !Array.isArray(item.incorrectIds)) continue;
      result[day] = {
        day,
        attempts: item.attempts,
        latestScore: item.latestScore!,
        bestScore: Math.max(item.bestScore!, item.latestScore!),
        totalQuestions: item.totalQuestions,
        incorrectIds: [...new Set(item.incorrectIds.filter(
          (id): id is string => typeof id === "string" && id.length > 0 && id.length <= 100,
        ))].slice(0, 20),
        updatedAt: typeof item.updatedAt === "number" && Number.isFinite(item.updatedAt) ? item.updatedAt : 0,
      };
    }
    return result;
  } catch {
    return {};
  }
}

export function createTestRecord(
  prior: DailyTestRecord | undefined,
  day: number,
  questions: readonly TestQuestion[],
  answers: readonly (number | null)[],
  timestamp: number,
): DailyTestRecord {
  if (!questions.length || questions.length !== answers.length ||
      questions.some((q, i) => q.day !== day || !Number.isInteger(answers[i]) ||
        (answers[i] as number) < 0 || (answers[i] as number) >= q.options.length)) {
    throw new Error("Answer every question before submitting.");
  }
  const score = questions.filter((q, i) => q.answer === answers[i]).length;
  return {
    day,
    attempts: (prior?.attempts ?? 0) + 1,
    latestScore: score,
    bestScore: Math.max(prior?.bestScore ?? 0, score),
    totalQuestions: questions.length,
    incorrectIds: questions.filter((q, i) => q.answer !== answers[i]).map((q) => q.id),
    updatedAt: timestamp,
  };
}

export function getRevisionQuestions(
  records: DailyTestRecords,
  getQuestions: (day: number) => readonly TestQuestion[],
  limit = 10,
): TestQuestion[] {
  return Object.values(records)
    .filter((record) => record.incorrectIds.length > 0)
    .sort((a, b) => a.updatedAt - b.updatedAt || a.day - b.day)
    .flatMap((record) => {
      const mistakes = new Set(record.incorrectIds);
      return getQuestions(record.day).filter((question) => mistakes.has(question.id));
    })
    .slice(0, Math.max(0, limit));
}

/** Clearing revised mistakes does not change exam scores or attempt counts. */
export function clearRevisedMistakes(records: DailyTestRecords, correctlyReviewedIds: readonly string[]): DailyTestRecords {
  const cleared = new Set(correctlyReviewedIds);
  const next: DailyTestRecords = {};
  for (const [key, record] of Object.entries(records)) {
    next[Number(key)] = { ...record, incorrectIds: record.incorrectIds.filter((id) => !cleared.has(id)) };
  }
  return next;
}
