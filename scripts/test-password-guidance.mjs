import assert from "node:assert/strict";
import { test } from "node:test";
import { passwordGuidance } from "../src/lib/password-guidance.ts";

test("empty password receives no strength bars", () => {
  assert.equal(passwordGuidance("").score, 0);
});
test("short passwords are flagged as too short", () => {
  assert.equal(passwordGuidance("abc").score, 1);
  assert.match(passwordGuidance("short").message, /at least 8/);
});
test("eight character passwords are allowed but encouraged to be longer", () => {
  assert.ok(passwordGuidance("eight888").score >= 2);
  assert.match(passwordGuidance("abcdefgh").message, /12/);
});
test("long mixed-case passphrases receive stronger guidance", () => {
  assert.equal(passwordGuidance("LongUniquePassphrase42!").score, 4);
});
test("length and complexity are not falsely presented as a security guarantee", () => {
  assert.match(passwordGuidance("thisisjustalongpassphrase").message, /Avoid reusing passwords/);
});
