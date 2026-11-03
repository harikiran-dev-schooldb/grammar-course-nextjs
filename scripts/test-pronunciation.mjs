import test from "node:test";
import assert from "node:assert/strict";
import { analyzeReading, scorePronunciation } from "../src/lib/pronunciation.ts";

test("pronunciation scoring rewards an exact sentence", () => {
  assert.equal(scorePronunciation("Maya is kind.", "Maya is kind"), 100);
});

test("pronunciation scoring handles missing and unrelated words", () => {
  assert.equal(scorePronunciation("The books are new", "the books new"), 75);
  assert.equal(scorePronunciation("The books are new", "hello there"), 0);
});

test("reading analysis marks correct, close and missed words in order", () => {
  const result = analyzeReading("The little cat sits on the mat", "the litle cat on the map");
  assert.equal(result.words.length, 7);
  assert.equal(result.words[0].status, "correct");
  assert.equal(result.words[1].status, "close");
  assert.ok(result.missed.includes("sits"));
  assert.ok(result.accuracy > 50 && result.accuracy < 100);
});
