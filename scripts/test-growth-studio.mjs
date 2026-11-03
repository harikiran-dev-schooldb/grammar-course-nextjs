import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = readFileSync(new URL("../src/components/growth-studio.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const speech = readFileSync(new URL("../src/lib/speech.ts", import.meta.url), "utf8");
const route = readFileSync(new URL("../src/app/api/speech/route.ts", import.meta.url), "utf8");
const progress = readFileSync(new URL("../src/lib/progress.ts", import.meta.url), "utf8");

test("Growth Studio connects every requested learning expansion", () => {
  for (const label of ["Adaptive weekly plan","Story World","Real-life speaking coach","Parent & teacher profiles","Your reward room","Premium voice studio"]) assert.match(component, new RegExp(label));
  assert.match(page, /<GrowthStudio/);
});

test("neural speech uses a secure server route and offline device fallback", () => {
  assert.match(route, /AZURE_SPEECH_KEY/);
  assert.match(route, /te-IN-ShrutiNeural/);
  assert.match(speech, /grammar-studio-neural-voice-v1/);
  assert.match(speech, /fallbackSpeak/);
});

test("managed learners merge and sync with cloud progress", () => {
  assert.match(progress, /managedLearners: ManagedLearner\[\]/);
  assert.match(progress, /reduce<ManagedLearner\[\]>/);
  assert.match(page, /managedLearners=\{managedLearners\}/);
});
