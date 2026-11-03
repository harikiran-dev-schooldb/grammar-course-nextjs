/**
 * Validate persisted lesson progress before using it in the UI.
 * Older installations store a JSON array of day numbers.
 */
export function parseCompletedDays(raw: string | null, validDays: readonly number[]): number[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const allowed = new Set(validDays);
    return [...new Set(parsed.filter(
      (day): day is number => typeof day === "number" && Number.isInteger(day) && allowed.has(day),
    ))].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/** Return a safe, zero-based lesson index from the previously saved day. */
export function parseSavedDayIndex(raw: string | null, validDays: readonly number[]): number {
  if (raw === null || !/^[1-9]\d*$/.test(raw)) return 0;
  const day = Number(raw);
  if (!Number.isSafeInteger(day)) return 0;
  const index = validDays.indexOf(day);
  return index < 0 ? 0 : index;
}

export type Mistake = {
  id: string;
  type: "grammar" | "listening" | "reading" | "conversation" | "spelling";
  day: number;
  prompt: string;
  answer: string;
  attempts: number;
  reviewed: boolean;
  lastSeen: string;
  mastery?: number;
  nextReviewAt?: string;
};

export type PlacementLevel = "beginner" | "everyday" | "confident";
export type ReadingLevel = "pre-reader" | "word-reader" | "sentence-reader";
export type AgeMode = "kids" | "teens" | "adults";

export type LearningPreferences = {
  placementLevel: PlacementLevel | null;
  dailyGoalMinutes: number;
  reminderTime: string;
  remindersEnabled: boolean;
  readingLevel: ReadingLevel | null;
  ageMode: AgeMode;
};

export type PronunciationResult = {
  day: number;
  score: number;
  transcript: string;
  updatedAt: string;
};

export type ReadingCoachResult = {
  passageId: string;
  accuracy: number;
  wordsPerMinute: number;
  missedWords: string[];
  transcript: string;
  updatedAt: string;
};

export type CloudDailyTestRecord = {
  day: number;
  attempts: number;
  latestScore: number;
  bestScore: number;
  totalQuestions: number;
  incorrectIds: string[];
  updatedAt: number;
};

export type CloudDailyTestRecords = Record<number, CloudDailyTestRecord>;

function mergeCloudDailyTests(local: CloudDailyTestRecords, remote: CloudDailyTestRecords): CloudDailyTestRecords {
  const merged: CloudDailyTestRecords = {};
  const days = new Set([...Object.keys(local), ...Object.keys(remote)].map(Number));
  for (const day of days) {
    const localRecord = local[day];
    const remoteRecord = remote[day];
    if (!localRecord) { merged[day] = remoteRecord; continue; }
    if (!remoteRecord) { merged[day] = localRecord; continue; }
    const newest = localRecord.updatedAt >= remoteRecord.updatedAt ? localRecord : remoteRecord;
    merged[day] = {
      ...newest,
      attempts: Math.max(localRecord.attempts, remoteRecord.attempts),
      bestScore: Math.max(localRecord.bestScore, remoteRecord.bestScore),
      updatedAt: Math.max(localRecord.updatedAt, remoteRecord.updatedAt),
    };
  }
  return merged;
}

export type CloudProgress = {
  displayName: string;
  completed: number[];
  currentDay: number;
  skillsDone: string[];
  writings: Record<string, string>;
  mistakes: Mistake[];
  activityDates: string[];
  badges: string[];
  preferences: LearningPreferences;
  pronunciationResults: PronunciationResult[];
  readingCoachResults: ReadingCoachResult[];
  studyMinutes: Record<string, number>;
  dailyTests: CloudDailyTestRecords;
  conversationDays: number[];
  wordDays: number[];
};

export const defaultPreferences: LearningPreferences = {
  placementLevel: null,
  dailyGoalMinutes: 15,
  reminderTime: "19:00",
  remindersEnabled: false,
  readingLevel: null,
  ageMode: "kids",
};

export const emptyProgress = (displayName = "Learner"): CloudProgress => ({
  displayName,
  completed: [],
  currentDay: 1,
  skillsDone: [],
  writings: {},
  mistakes: [],
  activityDates: [],
  badges: [],
  preferences: defaultPreferences,
  pronunciationResults: [],
  readingCoachResults: [],
  studyMinutes: {},
  dailyTests: {},
  conversationDays: [],
  wordDays: [],
});

export function mergeProgress(local: CloudProgress, remote: CloudProgress): CloudProgress {
  const mistakeMap = new Map([...remote.mistakes, ...local.mistakes].map((item) => [item.id, item]));
  return {
    displayName: remote.displayName || local.displayName,
    completed: [...new Set([...local.completed, ...remote.completed])].sort((a, b) => a - b),
    currentDay: Math.max(local.currentDay, remote.currentDay),
    skillsDone: [...new Set([...local.skillsDone, ...remote.skillsDone])],
    writings: { ...remote.writings, ...local.writings },
    mistakes: [...mistakeMap.values()].slice(-100),
    activityDates: [...new Set([...local.activityDates, ...remote.activityDates])].sort(),
    badges: [...new Set([...local.badges, ...remote.badges])],
    preferences: { ...defaultPreferences, ...local.preferences, ...remote.preferences },
    pronunciationResults: [...remote.pronunciationResults, ...local.pronunciationResults]
      .reduce<PronunciationResult[]>((items, result) => {
        const existing = items.findIndex((item) => item.day === result.day);
        if (existing < 0) return [...items, result];
        if (new Date(result.updatedAt).getTime() > new Date(items[existing].updatedAt).getTime()) items[existing] = result;
        return items;
      }, [])
      .sort((a, b) => a.day - b.day),
    readingCoachResults: [...(remote.readingCoachResults || []), ...(local.readingCoachResults || [])]
      .reduce<ReadingCoachResult[]>((items, result) => {
        const existing = items.findIndex((item) => item.passageId === result.passageId);
        if (existing < 0) return [...items, result];
        if (new Date(result.updatedAt).getTime() > new Date(items[existing].updatedAt).getTime()) items[existing] = result;
        return items;
      }, []),
    studyMinutes: Object.fromEntries([...new Set([...Object.keys(local.studyMinutes), ...Object.keys(remote.studyMinutes)])]
      .map((date) => [date, Math.max(local.studyMinutes[date] || 0, remote.studyMinutes[date] || 0)])),
    dailyTests: mergeCloudDailyTests(local.dailyTests || {}, remote.dailyTests || {}),
    conversationDays: [...new Set([...(local.conversationDays || []), ...(remote.conversationDays || [])])].sort((a, b) => a - b),
    wordDays: [...new Set([...(local.wordDays || []), ...(remote.wordDays || [])])].sort((a, b) => a - b),
  };
}
