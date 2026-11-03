function words(value: string): string[] {
  return value.toLocaleLowerCase("en").replace(/[^a-z0-9'\s]/g, " ").split(/\s+/).filter(Boolean);
}

export type ReadingWordStatus = { word: string; status: "correct" | "close" | "missed" };
export type ReadingAnalysis = { words: ReadingWordStatus[]; accuracy: number; correct: number; close: number; missed: string[]; extra: string[] };

function wordDistance(left: string, right: string): number {
  const rows = Array.from({ length: left.length + 1 }, (_, row) => {
    const values = Array(right.length + 1).fill(0);
    values[0] = row;
    return values;
  });
  for (let column = 0; column <= right.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= left.length; row += 1) for (let column = 1; column <= right.length; column += 1) {
    rows[row][column] = Math.min(rows[row - 1][column] + 1, rows[row][column - 1] + 1, rows[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1));
  }
  return rows[left.length][right.length];
}

/** Align a read-aloud transcript to the passage and classify every expected word. */
export function analyzeReading(target: string, transcript: string): ReadingAnalysis {
  const expected = words(target);
  const heard = words(transcript);
  const rows = Array.from({ length: expected.length + 1 }, (_, row) => {
    const values = Array(heard.length + 1).fill(0);
    values[0] = row;
    return values;
  });
  for (let column = 0; column <= heard.length; column += 1) rows[0][column] = column;
  const substitution = (left: string, right: string) => left === right ? 0 : wordDistance(left, right) / Math.max(left.length, right.length) <= .45 ? .5 : 1;
  for (let row = 1; row <= expected.length; row += 1) for (let column = 1; column <= heard.length; column += 1) {
    rows[row][column] = Math.min(rows[row - 1][column] + 1, rows[row][column - 1] + 1, rows[row - 1][column - 1] + substitution(expected[row - 1], heard[column - 1]));
  }
  const statuses: ReadingWordStatus[] = [];
  const extras: string[] = [];
  let row = expected.length;
  let column = heard.length;
  while (row > 0 || column > 0) {
    const canPair = row > 0 && column > 0;
    const pairCost = canPair ? substitution(expected[row - 1], heard[column - 1]) : Number.POSITIVE_INFINITY;
    if (canPair && Math.abs(rows[row][column] - (rows[row - 1][column - 1] + pairCost)) < .001) {
      statuses.unshift({ word: expected[row - 1], status: pairCost === 0 ? "correct" : pairCost === .5 ? "close" : "missed" });
      if (pairCost === 1) extras.unshift(heard[column - 1]);
      row -= 1; column -= 1;
    } else if (row > 0 && Math.abs(rows[row][column] - (rows[row - 1][column] + 1)) < .001) {
      statuses.unshift({ word: expected[row - 1], status: "missed" });
      row -= 1;
    } else if (column > 0) {
      extras.unshift(heard[column - 1]);
      column -= 1;
    }
  }
  const correct = statuses.filter((item) => item.status === "correct").length;
  const close = statuses.filter((item) => item.status === "close").length;
  return { words: statuses, correct, close, accuracy: expected.length ? Math.round(((correct + close * .5) / expected.length) * 100) : 0, missed: statuses.filter((item) => item.status !== "correct").map((item) => item.word), extra: extras };
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

