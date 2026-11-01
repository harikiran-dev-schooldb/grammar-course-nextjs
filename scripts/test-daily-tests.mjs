import assert from "node:assert/strict";
import { test } from "node:test";
import { percent, PASS_PERCENT, parseDailyTestRecords, createTestRecord, getRevisionQuestions, clearRevisedMistakes } from "../src/lib/daily-test-core.ts";

const questions = Array.from({ length: 5 }, (_, index) => ({
  id: "day-2-q-" + index, day: 2, prompt: "Question " + index,
  promptTe: "ప్రశ్న", options: ["A","B","C"], answer: index % 3,
  explanation: "Because", explanationTe: "ఎందుకంటే",
}));
const correct = questions.map((q) => q.answer);

test("passing threshold, exact score and no mistakes", () => {
  const record = createTestRecord(undefined, 2, questions, correct, 100);
  assert.equal(record.latestScore, 5);
  assert.equal(percent(record.latestScore, record.totalQuestions), 100);
  assert.equal(PASS_PERCENT, 80);
  assert.deepEqual(record.incorrectIds, []);
});

test("retakes keep best score separate from latest score and mistakes", () => {
  const first = createTestRecord(undefined, 2, questions, [2,2,2,2,2], 100);
  const second = createTestRecord(first, 2, questions, correct, 200);
  const third = createTestRecord(second, 2, questions, [2,2,2,2,2], 300);
  assert.equal(third.attempts, 3);
  assert.equal(third.bestScore, 5);
  assert.equal(third.latestScore, 1);
  assert.equal(third.incorrectIds.length, 4);
});

test("refuses incomplete or invalid answers", () => {
  assert.throws(() => createTestRecord(undefined, 2, questions, [0,null,0,0,0], 1));
  assert.throws(() => createTestRecord(undefined, 2, questions, [0,1,2], 1));
  assert.throws(() => createTestRecord(undefined, 2, questions, [8,0,0,0,0], 1));
});

test("rejects malformed and unknown day records", () => {
  assert.deepEqual(parseDailyTestRecords("not json", [2]), {});
  assert.deepEqual(parseDailyTestRecords("[]", [2]), {});
  assert.deepEqual(parseDailyTestRecords('{"2":{"attempts":0}}', [2]), {});
  assert.deepEqual(parseDailyTestRecords('{"44":{"attempts":1,"latestScore":0,"bestScore":0,"totalQuestions":5,"incorrectIds":[]}}', [2]), {});
});

test("records survive JSON round trip", () => {
  const record = createTestRecord(undefined, 2, questions, [0,0,0,0,0], 123);
  const parsed = parseDailyTestRecords(JSON.stringify({2:record}), [2]);
  assert.equal(parsed[2].latestScore, record.latestScore);
  assert.deepEqual(parsed[2].incorrectIds, record.incorrectIds);
});

test("revision queue includes only incorrectly answered questions", () => {
  const record = createTestRecord(undefined, 2, questions, [2,2,2,2,2], 100);
  const pool = getRevisionQuestions({2:record}, (day) => day === 2 ? questions : [], 10);
  assert.deepEqual(pool.map((q) => q.id), record.incorrectIds);
});

test("reviewed mistakes clear without inflating the test score", () => {
  const record = createTestRecord(undefined, 2, questions, [2,2,2,2,2], 100);
  const revised = clearRevisedMistakes({2:record}, [record.incorrectIds[0]]);
  assert.equal(revised[2].incorrectIds.length, record.incorrectIds.length - 1);
  assert.equal(revised[2].latestScore, record.latestScore);
  assert.equal(revised[2].bestScore, record.bestScore);
});
