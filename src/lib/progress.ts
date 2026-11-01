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
};

export type CloudProgress = {
  displayName: string;
  completed: number[];
  currentDay: number;
  skillsDone: string[];
  writings: Record<string, string>;
  mistakes: Mistake[];
  activityDates: string[];
  badges: string[];
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
  };
}
