import { createNeonAuth } from "@neon/auth/next/server";

export const neonConfigured = Boolean(
  process.env.NEON_AUTH_BASE_URL &&
  process.env.NEON_AUTH_COOKIE_SECRET &&
  process.env.NEON_AUTH_COOKIE_SECRET.length >= 32,
);

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL || "https://auth-not-configured.invalid/auth",
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || "local-build-placeholder-secret-32-characters",
    sessionDataTtl: 300,
  },
  logLevel: neonConfigured ? "warn" : "silent",
});
