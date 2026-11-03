import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const page = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const journey = readFileSync(new URL("../src/components/learning-journey.tsx", import.meta.url), "utf8");
const foundation = readFileSync(new URL("../src/components/foundation-playground.tsx", import.meta.url), "utf8");
const completeHub = readFileSync(new URL("../src/components/complete-learning-hub.tsx", import.meta.url), "utf8");
const routeNavigator = readFileSync(new URL("../src/components/lesson-route-navigator.tsx", import.meta.url), "utf8");
const todayHome = readFileSync(new URL("../src/components/today-home.tsx", import.meta.url), "utf8");
const speakingMission = readFileSync(new URL("../src/components/speaking-mission-coach.tsx", import.meta.url), "utf8");
const curriculumPath = readFileSync(new URL("../src/components/curriculum-path.tsx", import.meta.url), "utf8");
const courseLibrary = readFileSync(new URL("../src/components/course-library.tsx", import.meta.url), "utf8");
const expandedCurriculum = readFileSync(new URL("../src/data/expanded-curriculum.ts", import.meta.url), "utf8");
const userGuide = readFileSync(new URL("../src/components/user-guide.tsx", import.meta.url), "utf8");
const phonicsAcademy = readFileSync(new URL("../src/components/phonics-academy.tsx", import.meta.url), "utf8");
const phonicsCourse = readFileSync(new URL("../src/data/phonics-course.ts", import.meta.url), "utf8");
const readingCoach = readFileSync(new URL("../src/components/read-aloud-coach.tsx", import.meta.url), "utf8");
const readingPassages = readFileSync(new URL("../src/data/reading-passages.ts", import.meta.url), "utf8");
const progressApi = readFileSync(new URL("../src/app/api/progress/route.ts", import.meta.url), "utf8");
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
test("guided journey connects placement, lesson mission, mastery and complete pathway", () => {
  assert.match(page, /<LearningJourney/);
  assert.match(page, /conversationDays/);
  assert.match(page, /wordDays/);
  assert.match(journey, /Next best action/);
  assert.match(journey, /Your six-skill mastery/);
  assert.match(journey, /From first sounds to advanced expression/);
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
  assert.match(worker, /grammar-studio-v26-growth-studio/);
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

test("guided route makes the lesson order and next action explicit", () => {
  assert.match(routeNavigator, /Your lesson roadmap/);
  assert.match(routeNavigator, /Core pathway · Lesson/);
  assert.match(routeNavigator, /completionPercent/);
  assert.match(routeNavigator, /Lesson route progress/);
  assert.match(routeNavigator, /Previous/);
  assert.match(routeNavigator, /Next:/);
  assert.match(routeNavigator, /IntersectionObserver/);
  assert.match(page, /LessonRouteNavigator key=\{lesson.day\} day=\{lesson.day\} steps=\{journeySteps\}/);
});

test("Learning home gives one focused entry point instead of a long page", () => {
  assert.match(todayHome, /Continue learning/);
  assert.match(todayHome, /Speaking practice/);
  assert.match(todayHome, /Recommended order/);
  assert.match(page, /appView === "home"/);
});

test("speaking missions accept real voice answers and bilingual coaching", () => {
  assert.match(speakingMission, /SpeechRecognition/);
  assert.match(speakingMission, /scorePronunciation/);
  assert.match(speakingMission, /Turn \{turn\+1\} of/);
  assert.match(speakingMission, /Live speaking mission/);
  assert.match(page, /speaking-mission-\$\{lesson.day\}/);
});

test("level curriculum organizes content from pre-reader through B2", () => {
  assert.match(curriculumPath, /Pre-reader/);
  assert.match(curriculumPath, /A1/);
  assert.match(curriculumPath, /A2/);
  assert.match(curriculumPath, /B1/);
  assert.match(curriculumPath, /B2/);
  assert.match(curriculumPath, /Choose the learner experience/);
  assert.match(curriculumPath, /Mastery gate passed/);
  assert.match(page, /appView === "curriculum"/);
});

test("expanded course provides 120 interactive lesson activities", () => {
  assert.match(expandedCurriculum, /expandedLessonCount/);
  assert.equal((expandedCurriculum.match(/id:"/g) || []).length, 30);
  assert.match(courseLibrary, /120-lesson content library/);
  assert.match(courseLibrary, /Explore words/);
  assert.match(courseLibrary, /Read & listen/);
  assert.match(courseLibrary, /Speak & write/);
  assert.match(courseLibrary, /Checkpoint/);
  assert.match(page, /appView === "library"/);
});

test("bilingual user guide explains the complete learning workflow", () => {
  assert.match(page, /appView === "guide"/);
  assert.match(page, /UserGuide/);
  assert.match(userGuide, /What to do, in the correct order/);
  assert.match(userGuide, /Your progress saves automatically/);
  assert.match(userGuide, /Download offline/);
  assert.match(userGuide, /lang="te"/);
});

test("complete phonics academy teaches sounds through fluent reading", () => {
  assert.match(page, /appView === "phonics"/);
  assert.match(todayHome, /Phonics Academy/);
  assert.equal((phonicsCourse.match(/id:"/g) || []).length, 12);
  assert.match(phonicsCourse, /Digraphs/);
  assert.match(phonicsCourse, /Magic e/);
  assert.match(phonicsCourse, /R-controlled vowels/);
  assert.match(phonicsCourse, /Syllables & reading fluency/);
  assert.match(phonicsAcademy, /Learn sounds/);
  assert.match(phonicsAcademy, /Blend a word/);
  assert.match(phonicsAcademy, /Quick check/);
  assert.match(phonicsAcademy, /phonics-\$\{stage.id\}/);
});

test("read-aloud coach scores every word and saves adaptive progress", () => {
  assert.match(page, /appView === "reading-coach"/);
  assert.match(todayHome, /Read aloud and improve every word/);
  assert.equal((readingPassages.match(/id:"/g) || []).length, 12);
  assert.match(readingCoach, /SpeechRecognition/);
  assert.match(readingCoach, /analyzeReading/);
  assert.match(readingCoach, /wordsPerMinute/);
  assert.match(readingCoach, /Tap and repeat these words/);
  assert.match(readingCoach, /reading-coach-\$\{passage.id\}/);
  assert.match(progressApi, /reading_coach_results/);
});
