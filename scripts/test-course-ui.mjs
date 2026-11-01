import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
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
test("offline shell updates without discarding downloaded audio", () => {
  assert.match(worker, /grammar-studio-v8-premium-learning-ui/);
  assert.match(worker, /grammar-studio-v5-complete-english-audio/);
});
