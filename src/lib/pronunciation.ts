function words(value: string): string[] {
  return value.toLocaleLowerCase("en").replace(/[^a-z0-9'\s]/g, " ").split(/\s+/).filter(Boolean);
}

/** A forgiving word-order score for browser speech recognition transcripts. */
export function scorePronunciation(target: string, transcript: string): number {
  const expected = words(target);
  const heard = words(transcript);
  if (!expected.length || !heard.length) return 0;
  const rows = Array.from({ length: expected.length + 1 }, (_, index) => {
    const row = Array(heard.length + 1).fill(0);
    row[0] = index;
    return row;
  });
  for (let column = 0; column <= heard.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= expected.length; row += 1) {
    for (let column = 1; column <= heard.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + (expected[row - 1] === heard[column - 1] ? 0 : 1),
      );
    }
  }
  const distance = rows[expected.length][heard.length];
  return Math.max(0, Math.round((1 - distance / Math.max(expected.length, heard.length)) * 100));
}

