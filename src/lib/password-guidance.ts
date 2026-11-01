export type PasswordGuidance = { score: 0 | 1 | 2 | 3 | 4; label: string; message: string };

/** Helpful visual estimate, not a password-security guarantee or password validator. */
export function passwordGuidance(value: string): PasswordGuidance {
  if (!value) return { score: 0, label: "Not entered", message: "Use a unique password or passphrase." };
  const longEnough = value.length >= 8;
  const hasMixedCase = /[a-z]/.test(value) && /[A-Z]/.test(value);
  const hasOther = /[0-9]/.test(value) || /[^a-zA-Z0-9]/.test(value);
  const isLong = value.length >= 12;
  const isVeryLong = value.length >= 16;

  let score: 0 | 1 | 2 | 3 | 4 = 1;
  if (longEnough) score = 2;
  if (longEnough && (hasMixedCase || hasOther || isLong)) score = 3;
  if (isLong && (hasMixedCase || hasOther || isVeryLong)) score = 4;

  const label = ["Not entered", "Too short", "Fair", "Good", "Stronger"][score];
  const message = !longEnough
    ? "Use at least 8 characters; 12 or more is better."
    : !isLong
      ? "Try 12+ characters or a longer, unique passphrase."
      : "A longer, unique passphrase is a good choice. Avoid reusing passwords.";
  return { score, label, message };
}
