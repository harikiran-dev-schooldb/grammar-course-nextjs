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
