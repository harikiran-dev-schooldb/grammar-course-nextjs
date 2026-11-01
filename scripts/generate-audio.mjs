import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lessons } from "../src/data/lessons.ts";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(projectRoot, "public", "audio");
const onlyDay = Number(process.argv.find((value) => value.startsWith("--day="))?.split("=")[1]) || null;
const edgeTts = process.env.EDGE_TTS_BIN || "edge-tts";

const voices = {
  en: { name: "en-IN-NeerjaExpressiveNeural", rate: "-5%" },
  te: { name: "te-IN-ShrutiNeural", rate: "-8%" },
};

function cleanForSpeech(text, language) {
  const clean = text
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, ", ")
    .replace(/\s+/g, " ")
    .trim();

  if (language === "en") return clean;

  const replacements = [
    [/Nouns?/gi, "నామవాచకాలు"], [/pronouns?/gi, "సర్వనామాలు"],
    [/adjectives?/gi, "విశేషణాలు"], [/adverbs?/gi, "క్రియా విశేషణాలు"],
    [/verbs?/gi, "క్రియలు"], [/subjects?/gi, "కర్తలు"],
    [/sentences?/gi, "వాక్యాలు"], [/questions?/gi, "ప్రశ్నలు"],
    [/words?/gi, "పదాలు"], [/rules?/gi, "నియమాలు"],
    [/examples?/gi, "ఉదాహరణలు"], [/forms?/gi, "రూపాలు"],
    [/singular/gi, "ఏకవచనం"], [/plural/gi, "బహువచనం"],
    [/present/gi, "వర్తమాన కాలం"], [/past/gi, "భూత కాలం"],
    [/future/gi, "భవిష్యత్ కాలం"], [/correct/gi, "సరైనది"],
    [/clear/gi, "స్పష్టంగా"], [/general/gi, "సాధారణ"],
    [/person/gi, "వ్యక్తి"], [/people/gi, "వ్యక్తులు"],
    [/place/gi, "ప్రదేశం"], [/things?/gi, "వస్తువులు"],
    [/meaning/gi, "అర్థం"], [/pattern/gi, "పద్ధతి"],
    [/base/gi, "మూల"], [/time/gi, "సమయం"],
    [/plan/gi, "ప్రణాళిక"], [/story/gi, "కథ"],
    [/practice/gi, "అభ్యాసం"], [/slowly/gi, "నెమ్మదిగా"],
    [/finish/gi, "పూర్తి"], [/mistakes?/gi, "తప్పులు"],
  ];

  return replacements.reduce((result, [pattern, value]) => result.replace(pattern, value), clean);
}

function render(text, language, basename) {
  const voice = voices[language];
  const mp3 = join(outputDir, `${basename}.mp3`);
  const spokenText = cleanForSpeech(text, language);

  return new Promise((resolve, reject) => {
    const child = spawn(edgeTts, [
      "--voice", voice.name,
      "--rate", voice.rate,
      "--text", spokenText,
      "--write-media", mp3,
      "--no-progress",
    ], { stdio: ["ignore", "ignore", "pipe"] });
    let errorOutput = "";
    child.stderr.on("data", (chunk) => { errorOutput += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`Could not generate ${basename}: ${errorOutput}`)));
  });
}

await mkdir(outputDir, { recursive: true });

const tasks = [];
for (const lesson of lessons) {
  if (onlyDay && lesson.day !== onlyDay) continue;
  const day = String(lesson.day).padStart(2, "0");
  tasks.push({ day: lesson.day, text: lesson.teacherEn, language: "en", basename: `day-${day}-teacher-en` });
  tasks.push({ day: lesson.day, text: lesson.teacherTe, language: "te", basename: `day-${day}-teacher-te` });

  for (const [index, example] of lesson.examples.entries()) {
    const exampleNumber = String(index + 1).padStart(2, "0");
    tasks.push({ day: lesson.day, text: example.en, language: "en", basename: `day-${day}-example-${exampleNumber}-en` });
    tasks.push({ day: lesson.day, text: example.te, language: "te", basename: `day-${day}-example-${exampleNumber}-te` });
  }

  tasks.push({ day: lesson.day, text: lesson.speak, language: "en", basename: `day-${day}-speak-en` });
  tasks.push({ day: lesson.day, text: lesson.speakTe, language: "te", basename: `day-${day}-speak-te` });
}

let cursor = 0;
const completedByDay = new Map();

async function worker() {
  while (cursor < tasks.length) {
    const task = tasks[cursor];
    cursor += 1;
    await render(task.text, task.language, task.basename);
    const completed = (completedByDay.get(task.day) || 0) + 1;
    completedByDay.set(task.day, completed);
    if (completed === 10) console.log(`Generated lesson ${task.day}`);
  }
}

await Promise.all(Array.from({ length: Math.min(6, tasks.length) }, () => worker()));
