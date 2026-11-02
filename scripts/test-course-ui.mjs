import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const journey = readFileSync(new URL("../src/components/learning-journey.tsx", import.meta.url), "utf8");
const foundation = readFileSync(new URL("../src/components/foundation-playground.tsx", import.meta.url), "utf8");
const completeHub = readFileSync(new URL("../src/components/complete-learning-hub.tsx", import.meta.url), "utf8");
const worker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

test("lesson overview displays completion based on the existing course progress", () => {
  assert.match(page, /className="hero-progress-panel"/);
  assert.match(page, /style=\{\{ width: .\$\{progress\}%. \}\}/);
  assert.match(page, /completed\.length\} of \{lessons\.length\} lessons completed/);
});
test("mobile course navigation has a labelled accessible close control", () => {
  assert.match(page, /aria-controls="course-sidebar"/);
  assert.match(page, /aria-label="Close course navigation"/);
  assert.match(page, /href="#lesson-content"/);
  assert.match(styles, /\.site-shell \.sidebar-close/);
});
test("lesson completion remains visually distinct and announced to screen readers", () => {
  assert.match(page, /done \? "completed" : ""/);
  assert.match(page, /done \? " — completed" : ""/);
  assert.match(styles, /\.site-shell \.lesson-link\.completed:not\(\.active\)/);
});
test("answer selections and language controls expose state", () => {
  assert.match(page, /aria-pressed=\{listeningAnswer === index\}/);
  assert.match(page, /aria-pressed=\{readingAnswer === index\}/);
  assert.match(page, /aria-pressed=\{chosen\}/);
  assert.match(page, /aria-pressed=\{language === mode\}/);
});
test("guided journey connects placement, daily mission, mastery and course roadmap", () => {
  assert.match(page, /<LearningJourney/);
  assert.match(page, /conversationDays/);
  assert.match(page, /wordDays/);
  assert.match(journey, /Next best action/);
  assert.match(journey, /Your six-skill mastery/);
  assert.match(journey, /From foundations to real conversation/);
});
test("Starter Zone teaches pre-readers before grammar", () => {
  assert.match(page, /<FoundationPlayground/);
  assert.match(foundation, /Letters & sounds/);
  assert.match(foundation, /First words/);
  assert.match(foundation, /Build a sentence/);
  assert.match(foundation, /Reading Adventure/);
  assert.match(foundation, /Sound blender/);
  assert.match(foundation, /Word-by-word highlighting/);
  assert.match(foundation, /scorePronunciation/);
  assert.match(foundation, /I can read small words/);
  assert.match(foundation, /stars earned/);
  assert.match(foundation, /speak\(`\$\{activeLetter\[0\]\} for \$\{activeLetter\[1\]\}`\)/);
  assert.doesNotMatch(foundation, /activeLetter\[0\].*activeLetter\[0\].*is for/);
});
test("offline shell updates without discarding downloaded audio", () => {
  assert.match(worker, /grammar-studio-v16-adaptive-learning/);
  assert.match(worker, /grammar-studio-v5-complete-english-audio/);
});

test("adaptive command centre connects every English learning mode", () => {
  assert.match(completeHub, /My Coach/);
  assert.match(completeHub, /Practice Worlds/);
  assert.match(completeHub, /Parent View/);
  assert.match(completeHub, /Conversation Town/);
  assert.match(completeHub, /Listening Arcade/);
  assert.match(completeHub, /Writing Studio/);
  assert.match(completeHub, /Speaking Stage/);
  assert.match(completeHub, /Basics to advanced/);
  assert.match(completeHub, /Download full report/);
});
