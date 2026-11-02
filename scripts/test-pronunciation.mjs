import test from "node:test";
import assert from "node:assert/strict";
import { scorePronunciation } from "../src/lib/pronunciation.ts";

test("pronunciation scoring rewards an exact sentence", () => {
  assert.equal(scorePronunciation("Maya is kind.", "Maya is kind"), 100);
});

test("pronunciation scoring handles missing and unrelated words", () => {
  assert.equal(scorePronunciation("The books are new", "the books new"), 75);
  assert.equal(scorePronunciation("The books are new", "hello there"), 0);
});
