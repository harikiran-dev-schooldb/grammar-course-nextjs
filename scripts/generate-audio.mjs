import { mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lessons } from "../src/data/lessons.ts";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(projectRoot, "public", "audio");
const onlyDay = Number(process.argv.find((value) => value.startsWith("--day="))?.split("=")[1]) || null;

const voices = {
  en: { name: "Tara (English (India))", rate: "165" },
  te: { name: "Geeta", rate: "145" },
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
  const aiff = join(outputDir, `${basename}.aiff`);
  const wav = join(outputDir, `${basename}.wav`);
  const spokenText = cleanForSpeech(text, language);

  const sayResult = spawnSync("say", ["-v", voice.name, "-r", voice.rate, "-o", aiff, spokenText], { stdio: "inherit" });
  if (sayResult.status !== 0) throw new Error(`Could not generate ${basename}`);

  const convertResult = spawnSync("afconvert", [aiff, wav, "-f", "WAVE", "-d", "LEI16@22050"], { stdio: "inherit" });
  if (convertResult.status !== 0) throw new Error(`Could not convert ${basename}`);
  return rm(aiff);
}

await mkdir(outputDir, { recursive: true });

for (const lesson of lessons) {
  if (onlyDay && lesson.day !== onlyDay) continue;
  const day = String(lesson.day).padStart(2, "0");
  await render(lesson.teacherEn, "en", `day-${day}-teacher-en`);
  await render(lesson.teacherTe, "te", `day-${day}-teacher-te`);

  for (const [index, example] of lesson.examples.entries()) {
    const exampleNumber = String(index + 1).padStart(2, "0");
    await render(example.en, "en", `day-${day}-example-${exampleNumber}-en`);
    await render(example.te, "te", `day-${day}-example-${exampleNumber}-te`);
  }

  await render(lesson.speak, "en", `day-${day}-speak-en`);
  await render(lesson.speakTe, "te", `day-${day}-speak-te`);
  console.log(`Generated lesson ${lesson.day}`);
}
