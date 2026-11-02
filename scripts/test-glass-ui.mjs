import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/glass.css", import.meta.url), "utf8");
const premiumStyles = readFileSync(new URL("../src/app/schooldb.css", import.meta.url), "utf8");
const worker = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

test("glass styling loads after the base styles", () => {
  assert.match(layout, /import "\.\/globals\.css";\s*import "\.\/glass\.css";/);
  assert.match(layout, /import "\.\/schooldb\.css";/);
});
test("SchoolDB premium system covers authentication, course, labs and mobile UI", () => {
  assert.match(premiumStyles, /--schooldb-navy: #091540/);
  assert.match(premiumStyles, /\.auth-screen/);
  assert.match(premiumStyles, /\.site-shell \.lesson-hero/);
  assert.match(premiumStyles, /\.site-shell \.daily-test-hub/);
  assert.match(premiumStyles, /\.site-shell \.mobile-dock/);
});
test("glass surfaces preserve meaningful color fallbacks and text contrast", () => {
  assert.match(styles, /\.site-shell \.skills-lab/);
  assert.match(styles, /\.site-shell \.teacher-card/);
  assert.match(styles, /\.site-shell \.lesson-hero/);
  assert.match(styles, /rgba\(255, 255, 255, \.94\)/);
  assert.match(styles, /#10364a/);
});
test("supports Safari glass with progressive enhancement", () => {
  assert.match(styles, /@supports \(\(backdrop-filter:/);
  assert.match(styles, /-webkit-backdrop-filter/);
});
test("touch and accessibility preferences disable costly effects", () => {
  assert.match(styles, /@media \(max-width: 700px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(prefers-reduced-transparency: reduce\)/);
  assert.match(styles, /@media print/);
});
test("updated service worker preserves downloaded audio cache", () => {
  assert.match(worker, /grammar-studio-v18-today-speaking/);
  assert.match(worker, /grammar-studio-v5-complete-english-audio/);
});
