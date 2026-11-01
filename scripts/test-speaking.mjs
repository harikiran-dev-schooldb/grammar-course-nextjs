import assert from "node:assert/strict";
import { test } from "node:test";
import { formatRecordingDuration, getMicrophoneErrorMessage, getSupportedRecordingMimeType } from "../src/lib/speaking.ts";

test("chooses an audio type supported by the browser", () => {
  assert.equal(getSupportedRecordingMimeType((type) => type === "audio/mp4"), "audio/mp4");
  assert.equal(getSupportedRecordingMimeType((type) => type === "audio/webm;codecs=opus"), "audio/webm;codecs=opus");
});

test("falls back to the browser default when no MIME type matches", () => {
  assert.equal(getSupportedRecordingMimeType(() => false), undefined);
});

test("formats the elapsed time safely", () => {
  assert.equal(formatRecordingDuration(0), "0:00");
  assert.equal(formatRecordingDuration(9.8), "0:09");
  assert.equal(formatRecordingDuration(60), "1:00");
  assert.equal(formatRecordingDuration(-5), "0:00");
  assert.equal(formatRecordingDuration(Number.NaN), "0:00");
});

test("explains denied microphone permission", () => {
  assert.match(getMicrophoneErrorMessage({ name: "NotAllowedError" }), /denied/i);
  assert.match(getMicrophoneErrorMessage({ name: "SecurityError" }), /denied/i);
});

test("explains missing or busy microphones", () => {
  assert.match(getMicrophoneErrorMessage({ name: "NotFoundError" }), /No microphone/);
  assert.match(getMicrophoneErrorMessage({ name: "NotReadableError" }), /another app/);
});

test("handles unusual microphone errors", () => {
  assert.match(getMicrophoneErrorMessage(null), /could not start/i);
  assert.match(getMicrophoneErrorMessage(new Error("oops")), /could not start/i);
});
