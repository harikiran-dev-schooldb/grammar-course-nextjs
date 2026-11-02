import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyProgress, mergeProgress, parseCompletedDays, parseSavedDayIndex } from "../src/lib/progress.ts";

const days = Array.from({ length: 30 }, (_, index) => index + 1);

test("retains valid saved completion values", () => {
  assert.deepEqual(parseCompletedDays("[1,8,30]", days), [1,8,30]);
});

test("removes duplicates and sorts completed days", () => {
  assert.deepEqual(parseCompletedDays("[8,2,8,1]", days), [1,2,8]);
});

test("ignores corrupted, non-array, or missing progress", () => {
  for (const input of ["not-json", "{}", "false", "null", null]) {
    assert.deepEqual(parseCompletedDays(input, days), []);
  }
});

test("rejects invalid and out-of-range lesson values", () => {
  assert.deepEqual(parseCompletedDays('[1,0,31,2.5,"3",null,{},2]', days), [1,2]);
});

test("restores the chosen lesson as a zero-based index", () => {
  assert.equal(parseSavedDayIndex("30", days), 29);
  assert.equal(parseSavedDayIndex("1", days), 0);
});

test("uses day one for missing or unsafe saved day", () => {
  for (const input of [null, "", "0", "-1", "31", "foo", "3.5", "1e2", "9999999999999999999"]) {
    assert.equal(parseSavedDayIndex(input, days), 0);
  }
});

test("respects the actual lesson IDs", () => {
  assert.deepEqual(parseCompletedDays("[1,2,3,5]", [1,3,5]), [1,3,5]);
  assert.equal(parseSavedDayIndex("3", [1,3,5]), 1);
});

test("conversation and vocabulary mastery merge across devices", () => {
  const local = { ...emptyProgress("Learner"), conversationDays: [1, 3], wordDays: [1, 2] };
  const remote = { ...emptyProgress("Learner"), conversationDays: [2, 3], wordDays: [2, 4] };
  const merged = mergeProgress(local, remote);
  assert.deepEqual(merged.conversationDays, [1, 2, 3]);
  assert.deepEqual(merged.wordDays, [1, 2, 4]);
});
