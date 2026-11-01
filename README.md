# Grammar Studio

A responsive 30-day English grammar course built with Next.js, TypeScript, and Tailwind CSS.

## Live site

[https://grammar-course-nextjs.vercel.app](https://grammar-course-nextjs.vercel.app)

## Features

- 30 structured grammar lessons
- English, Telugu, and bilingual display modes
- Neural Indian English and Telugu audio for every explanation, example, and speaking prompt
- Daily English speaking coach with microphone transcription, match score, and bilingual feedback
- Installable Progressive Web App with offline navigation and lesson progress
- Optional one-tap download of all 300 audio clips for complete offline study
- Interactive practice questions with instant feedback
- Saved lesson progress using browser local storage
- Responsive desktop and mobile navigation

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Use **Download offline** in the course sidebar to cache every lesson and audio clip on the device. In supported browsers, use **Install app** to add Grammar Studio to the home screen or desktop.

## Regenerate neural audio

The checked-in audio files are ready to use. To rebuild them after editing lesson text, run:

```bash
npm run audio
```

Install `edge-tts`, then run the command above. It uses Neerja Expressive for Indian English and Shruti Neural for Telugu and writes MP3 clips to `public/audio`. If `edge-tts` is not on your `PATH`, set `EDGE_TTS_BIN` to its executable path.

## Validate

```bash
npm run lint
npm run build
```
