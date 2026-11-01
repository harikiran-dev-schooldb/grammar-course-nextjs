import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const file = readFileSync(new URL("../src/data/daily-test-questions.ts", import.meta.url), "utf8");
const source = readFileSync(new URL("../src/data/lessons.ts", import.meta.url), "utf8");
const bankMatch = file.match(/const extra: Record<number, Curated\[\]> = (\{[\s\S]*?\});/);
assert.ok(bankMatch, "Daily question bank should be defined.");
const bank = JSON.parse(bankMatch[1]);
const lessonIds = [...source.matchAll(/\bday:\s*(\d+)\s*,\s*unit:/g)].map((m) => Number(m[1]));

test("all 30 lessons have two curated grammar questions", () => {
  assert.equal(lessonIds.length, 30);
  assert.equal(new Set(lessonIds).size, 30);
  assert.equal(Object.keys(bank).length, 30);
  for (const day of lessonIds) {
    assert.equal(bank[day]?.length, 2, "Missing curated questions for Day " + day);
  }
});

test("all curated choices are distinct and correct answer indices are valid", () => {
  for (const entry of Object.values(bank).flat()) {
    assert.equal(entry.options.length, 3);
    assert.equal(new Set(entry.options).size, 3);
    assert.ok(Number.isInteger(entry.answer) && entry.answer >= 0 && entry.answer < 3);
    assert.ok(entry.prompt.length > 8 && entry.explanation.length > 8);
    assert.ok(entry.explanationTe.trim().length > 4);
  }
});

test("question builder includes original practice and two bilingual items", () => {
  assert.match(file, /lesson\.practice\.prompt/);
  assert.match(file, /translate-en/);
  assert.match(file, /translate-te/);
});
