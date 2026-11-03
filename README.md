# Grammar Studio

A responsive 30-day complete English course built with Next.js, TypeScript, and Tailwind CSS.

## Live site

[https://grammar-course-nextjs.vercel.app](https://grammar-course-nextjs.vercel.app)

## Features

- 30 structured grammar lessons
- English, Telugu, and bilingual display modes
- Neural Indian English and Telugu audio for every explanation, example, and speaking prompt
- 30 interactive English conversation role-plays with natural replies and bilingual teacher tips
- End-of-lesson Word Power with spelling practice, syllables, Telugu meanings, and neural pronunciation audio
- Daily listening comprehension with neural dialogue audio and optional transcripts
- Reading comprehension, saved writing practice, and English-to-Telugu translation activities
- Username/password login backed by Neon Auth, with recovery email for password resets
- Existing Neon email-only users can sign in once with email and claim a username
- Offline-first Neon progress sync across devices
- Smart revision queue built from the learner's grammar, listening, reading, conversation, and spelling mistakes
- Daily tests, a 10-question final test, achievement badges, streaks, and a printable certificate
- Parent/teacher progress reporting and instant writing feedback
- Private on-device speaking recorder for pronunciation practice
- Beginner, Everyday English, and Confident English learning path
- Installable Progressive Web App with offline navigation and lesson progress
- Optional one-tap download of all 420 audio clips for complete offline study
- Interactive practice questions with instant feedback
- Saved lesson progress using browser local storage
- Responsive desktop and mobile navigation

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and provide the values from a Neon project with Postgres and Better Auth enabled:

```dotenv
NEON_AUTH_BASE_URL=https://your-neon-auth.example/auth
NEON_AUTH_COOKIE_SECRET=at-least-32-random-characters
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
AZURE_SPEECH_KEY=your-azure-speech-resource-key
AZURE_SPEECH_REGION=centralindia
# Optional voice overrides:
AZURE_SPEECH_VOICE_EN=en-IN-NeerjaNeural
AZURE_SPEECH_VOICE_TE=te-IN-ShrutiNeural
```

Run `scripts/neon-schema.sql` once in the Neon SQL Editor. The API also creates the progress table safely if it is missing.

Use **Download offline** in the course sidebar to cache every lesson and audio clip on the device. In supported browsers, use **Install app** to add Grammar Studio to the home screen or desktop.

Azure Speech is optional. When its key and region are present, interactive English and Telugu audio uses neural voices through the server-only `/api/speech` route. Keys are never sent to the browser. Without Azure—or while offline—the app automatically uses the best voice installed on the learner's device. Generated neural clips are cached locally after first playback.

## Regenerate neural audio

The checked-in audio files are ready to use. To rebuild them after editing lesson text, run:

```bash
npm run audio
```

Install `edge-tts`, then run the command above. It uses Neerja Expressive for Indian English and Shruti Neural for Telugu and writes MP3 clips to `public/audio`. Add `-- --words-only` to regenerate the 90 Word Power pronunciations or `-- --listening-only` for the 30 listening dialogues. If `edge-tts` is not on your `PATH`, set `EDGE_TTS_BIN` to its executable path.

## Validate

```bash
npm run lint
npm run build
```

## Username sign-in and password recovery

The application now uses **username + password** at sign-in. Passwords and sessions stay with Neon Auth; a separate Neon Postgres table maps unique usernames to the Neon Auth user ID and recovery email. **Do not store passwords in this table.**

1. Ensure `DATABASE_URL`, `NEON_AUTH_BASE_URL`, and `NEON_AUTH_COOKIE_SECRET` are set in Vercel.
2. Run `scripts/neon-usernames.sql` in the Neon SQL Editor if the application's database role cannot create tables automatically.
3. Optional: set `APP_BASE_URL=https://your-production-domain` in Vercel for the email password-reset link. By default it uses `https://grammar-course-nextjs.vercel.app`.
4. Configure Neon Auth's password-reset email delivery and allowlist your app's `/reset-password` redirect URL in the Neon Auth settings. Test this flow with a disposable account and a real inbox.
5. Existing users may choose **Existing account? Use email once**, sign in, and register a username without losing their Neon Auth identity or saved progress.

New users enter their **name, unique username, recovery email, and password**. The recovery email is only used by Neon Auth and the server-side username mapping; it is not needed on subsequent username logins. If Neon requires email verification before a session can be created, finish verification and sign in once with the recovery email to claim the username. Username-password login uses a server-side lookup, and recovery addresses are never returned to the browser. Reset requests return a generic message to avoid exposing account existence and are throttled per username.

**Important:** Managed Neon Auth doesn't allow adding Better Auth's custom username plugin directly. The app-side mapping is an adapter over Neon Auth's existing email/password verification; it is not an independent password store. The exact password-reset method and email delivery should be verified against your deployed Neon Auth configuration.
