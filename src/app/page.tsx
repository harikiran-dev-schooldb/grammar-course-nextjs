"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageMode, lessons, units } from "@/data/lessons";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type OfflineStatus = "idle" | "downloading" | "ready" | "error";
type SpeechCoachStatus = "idle" | "listening" | "result" | "error" | "unsupported";

type SpeechRecognitionResultEvent = Event & {
  results: { [index: number]: { [index: number]: { transcript: string } } };
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

function pronunciationScore(expected: string, spoken: string) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9' ]/g, "").trim().split(/\s+/).filter(Boolean);
  const expectedWords = normalize(expected);
  const spokenWords = normalize(spoken);
  const rows = expectedWords.length + 1;
  const columns = spokenWords.length + 1;
  const distance = Array.from({ length: rows }, () => Array(columns).fill(0));
  for (let row = 0; row < rows; row += 1) distance[row][0] = row;
  for (let column = 0; column < columns; column += 1) distance[0][column] = column;
  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const substitution = expectedWords[row - 1] === spokenWords[column - 1] ? 0 : 1;
      distance[row][column] = Math.min(distance[row - 1][column] + 1, distance[row][column - 1] + 1, distance[row - 1][column - 1] + substitution);
    }
  }
  const longest = Math.max(expectedWords.length, spokenWords.length, 1);
  return Math.max(0, Math.round((1 - distance[rows - 1][columns - 1] / longest) * 100));
}

function SpeakerIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm12.5-1.5a6 6 0 0 1 0 9M18.8 5a9 9 0 0 1 0 14" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

function MicrophoneIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" /></svg>;
}

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [language, setLanguage] = useState<LanguageMode>("both");
  const [completed, setCompleted] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>("idle");
  const [offlineProgress, setOfflineProgress] = useState({ completed: 0, total: 300 });
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [speechCoachStatus, setSpeechCoachStatus] = useState<SpeechCoachStatus>("idle");
  const [spokenText, setSpokenText] = useState("");
  const [speechScore, setSpeechScore] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const lesson = lessons[current];
  const speakingTarget = lesson.examples[0].en;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = window.localStorage.getItem("grammar-studio-progress");
      const storedDay = Number(window.localStorage.getItem("grammar-studio-day"));
      if (stored) {
        try { setCompleted(JSON.parse(stored)); } catch { setCompleted([]); }
      }
      if (storedDay >= 1 && storedDay <= lessons.length) setCurrent(storedDay - 1);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("grammar-studio-progress", JSON.stringify(completed));
    window.localStorage.setItem("grammar-studio-day", String(current + 1));
  }, [completed, current]);

  useEffect(() => {
    const environmentFrame = window.requestAnimationFrame(() => {
      setIsOnline(window.navigator.onLine);
      setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
    });
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "OFFLINE_PROGRESS") {
        setOfflineStatus("downloading");
        setOfflineProgress({ completed: event.data.completed, total: event.data.total });
      }
      if (event.data?.type === "OFFLINE_READY") setOfflineStatus("ready");
      if (event.data?.type === "OFFLINE_ERROR") setOfflineStatus("error");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").then(async () => {
        const ready = await caches.match("/__grammar_studio_neural_audio_ready_v3__");
        if (ready) setOfflineStatus("ready");
      });
    }

    return () => {
      window.cancelAnimationFrame(environmentFrame);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, []);

  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const progress = Math.round((completed.length / lessons.length) * 100);
  const groupedLessons = useMemo(
    () => units.map((unit) => ({ unit, lessons: lessons.filter((item) => item.unit === unit) })),
    [],
  );

  const goToLesson = (index: number) => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(null);
    setSelected(null);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setSpeechCoachStatus("idle");
    setSpokenText("");
    setSpeechScore(null);
    setCurrent(Math.max(0, Math.min(lessons.length - 1, index)));
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleComplete = () => {
    setCompleted((items) => items.includes(lesson.day) ? items.filter((day) => day !== lesson.day) : [...items, lesson.day]);
  };

  const playAudio = (src: string, key: string) => {
    audioRef.current?.pause();
    if (speaking === key) {
      audioRef.current = null;
      setSpeaking(null);
      return;
    }

    const audio = new Audio(src);
    audio.preload = "auto";
    audio.onended = () => setSpeaking(null);
    audio.onerror = () => setSpeaking(null);
    audioRef.current = audio;
    setSpeaking(key);
    void audio.play().catch(() => setSpeaking(null));
  };

  const stopSpeaking = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(null);
  };

  const audioPath = (part: string, lang: "en" | "te") =>
    `/audio/day-${String(lesson.day).padStart(2, "0")}-${part}-${lang}.mp3`;

  const downloadForOffline = async () => {
    if (!("serviceWorker" in navigator) || !isOnline) return;
    setOfflineStatus("downloading");
    setOfflineProgress({ completed: 0, total: 300 });
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({ type: "CACHE_ALL_AUDIO" });
  };

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const startSpeechCoach = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setSpeechCoachStatus("unsupported");
      return;
    }

    audioRef.current?.pause();
    setSpeaking(null);
    recognitionRef.current?.stop();
    setSpokenText("");
    setSpeechScore(null);

    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      setSpokenText(transcript);
      setSpeechScore(pronunciationScore(speakingTarget, transcript));
      setSpeechCoachStatus("result");
    };
    recognition.onerror = () => setSpeechCoachStatus("error");
    recognition.onend = () => { recognitionRef.current = null; };
    recognitionRef.current = recognition;
    setSpeechCoachStatus("listening");
    recognition.start();
  };

  const isCorrect = selected === lesson.practice.answer;

  return (
    <div className="site-shell">
      <header className="topbar">
        <button className="menu-button" type="button" aria-label="Open course navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /><span /></button>
        <button className="brand" type="button" onClick={() => goToLesson(0)} aria-label="Grammar Studio home">
          <span className="brand-mark">G</span>
          <span className="brand-copy"><strong>Grammar Studio</strong><small>English · తెలుగు</small></span>
        </button>
        <div className="top-progress">
          <div className="top-progress-copy"><span>Course progress</span><strong>{completed.length} / 30</strong></div>
          <div className="progress-rail"><span style={{ width: `${progress}%` }} /></div>
        </div>
      </header>

      <div className="course-layout">
        <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
          <div className="sidebar-intro">
            <p className="kicker">30-day course</p><h2>Small lessons.<br />Real progress.</h2><p>One focused grammar idea each day, explained in the language that helps you most.</p>
            <section className={`offline-card ${offlineStatus}`} aria-live="polite">
              <div className="offline-card-heading"><strong>Offline course</strong><span className={isOnline ? "online" : "offline"}>{isOnline ? "Online" : "Offline"}</span></div>
              <p>{offlineStatus === "ready" ? "All 30 lessons and neural audio are ready offline. అన్ని పాఠాలు సిద్ధం." : offlineStatus === "downloading" ? `Downloading neural audio ${offlineProgress.completed} / ${offlineProgress.total}…` : offlineStatus === "error" ? "Download paused. Connect to the internet and try again." : "Save all lessons and the new neural audio to this device (about 9 MB)."}</p>
              {offlineStatus !== "ready" && <button type="button" onClick={downloadForOffline} disabled={!isOnline || offlineStatus === "downloading"}>{offlineStatus === "downloading" ? "Downloading…" : offlineStatus === "error" ? "Try again" : "Download offline"}</button>}
              {offlineStatus === "downloading" && <div className="offline-progress"><span style={{ width: `${Math.round((offlineProgress.completed / offlineProgress.total) * 100)}%` }} /></div>}
              {!isInstalled && installPrompt && <button type="button" className="install-button" onClick={installApp}>Install app</button>}
              {isInstalled && <small>Installed as an app ✓</small>}
            </section>
          </div>
          <nav aria-label="Lessons" className="lesson-nav">
            {groupedLessons.map((group) => (
              <section key={group.unit} className="nav-group">
                <h3>{group.unit}</h3>
                {group.lessons.map((item) => {
                  const index = item.day - 1;
                  const done = completed.includes(item.day);
                  return (
                    <button type="button" key={item.day} className={`lesson-link ${index === current ? "active" : ""}`} aria-current={index === current ? "page" : undefined} onClick={() => goToLesson(index)}>
                      <span className="lesson-number">{done ? <CheckIcon /> : item.day}</span>
                      <span className="lesson-link-copy"><strong>{item.title}</strong><small>{item.titleTe}</small></span>
                    </button>
                  );
                })}
              </section>
            ))}
          </nav>
        </aside>

        {menuOpen && <button className="page-overlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

        <main className="lesson-main">
          <section className="lesson-hero">
            <div className="hero-topline"><span>{lesson.unit}</span><span className="day-chip">Day {lesson.day} of 30</span></div>
            <div className="hero-grid">
              <div>
                <p className="lesson-label">Today’s lesson</p>
                <h1>{lesson.title}</h1>
                {(language === "te" || language === "both") && <p className="hero-telugu" lang="te">{lesson.titleTe}</p>}
                {(language === "en" || language === "both") && <p className="hero-objective">{lesson.objectiveEn}</p>}
                {(language === "te" || language === "both") && <p className="hero-objective telugu" lang="te">{lesson.objectiveTe}</p>}
              </div>
              <div className="day-medallion" aria-hidden="true"><span>DAY</span><strong>{lesson.day}</strong></div>
            </div>
            <div className="hero-controls">
              <div className="language-switch" aria-label="Explanation language">
                {(["en", "te", "both"] as LanguageMode[]).map((mode) => <button key={mode} type="button" className={language === mode ? "active" : ""} onClick={() => setLanguage(mode)}>{mode === "en" ? "English" : mode === "te" ? "తెలుగు" : "Both"}</button>)}
              </div>
              <span className="control-note">Choose how you want the lesson explained.</span>
            </div>
          </section>

          <section className="teacher-section section-block">
            <div className="section-heading"><div><p className="kicker">Teacher’s desk</p><h2>Let’s understand it</h2></div><span className="section-count">01</span></div>
            <div className={`teacher-grid ${language !== "both" ? "single" : ""}`}>
              {(language === "en" || language === "both") && (
                <article className="teacher-card english-card">
                  <div className="card-top"><span className="language-badge">EN</span><button type="button" className={`audio-button ${speaking === "teacher-en" ? "playing" : ""}`} onClick={() => speaking === "teacher-en" ? stopSpeaking() : playAudio(audioPath("teacher", "en"), "teacher-en")}><SpeakerIcon />{speaking === "teacher-en" ? "Stop" : "Listen"}</button></div>
                  <h3>Teacher explains</h3><p>{lesson.teacherEn}</p>
                </article>
              )}
              {(language === "te" || language === "both") && (
                <article className="teacher-card telugu-card" lang="te">
                  <div className="card-top"><span className="language-badge">తె</span><button type="button" className={`audio-button ${speaking === "teacher-te" ? "playing" : ""}`} onClick={() => speaking === "teacher-te" ? stopSpeaking() : playAudio(audioPath("teacher", "te"), "teacher-te")}><SpeakerIcon />{speaking === "teacher-te" ? "ఆపు" : "వినండి"}</button></div>
                  <h3>తెలుగులో సులభంగా</h3><p>{lesson.teacherTe}</p>
                </article>
              )}
            </div>
          </section>

          <section className="rules-examples section-block">
            <div className="rule-column">
              <div className="section-heading compact"><div><p className="kicker">Remember</p><h2>The rule</h2></div><span className="section-count">02</span></div>
              <ol className="rule-list">{lesson.rules.map((rule, index) => <li key={rule}><span>{String(index + 1).padStart(2, "0")}</span><p>{rule}</p></li>)}</ol>
            </div>
            <div className="example-column">
              <div className="section-heading compact"><div><p className="kicker">Listen & repeat</p><h2>Examples</h2></div><span className="section-count">03</span></div>
              <div className="example-stack">
                {lesson.examples.map((example, index) => (
                  <article className="example-row" key={example.en}>
                    <span className="example-index">{index + 1}</span>
                    <div><p>{example.en}</p>{language !== "en" && <small lang="te">{example.te}</small>}</div>
                    <div className="example-audio-group">
                      {language !== "te" && <button type="button" className={speaking === `example-${index + 1}-en` ? "playing" : ""} aria-label={`Listen to example ${index + 1} in English`} onClick={() => playAudio(audioPath(`example-${String(index + 1).padStart(2, "0")}`, "en"), `example-${index + 1}-en`)}><SpeakerIcon /><span>EN</span></button>}
                      {language !== "en" && <button type="button" className={speaking === `example-${index + 1}-te` ? "playing" : ""} aria-label={`Listen to example ${index + 1} in Telugu`} onClick={() => playAudio(audioPath(`example-${String(index + 1).padStart(2, "0")}`, "te"), `example-${index + 1}-te`)}><SpeakerIcon /><span>తె</span></button>}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="practice-section section-block">
            <div className="section-heading"><div><p className="kicker">Quick check</p><h2>Try it yourself</h2></div><span className="section-count">04</span></div>
            <div className="question-card">
              <div className="question-copy"><span>Question</span><h3>{lesson.practice.prompt}</h3>{language !== "en" && <p lang="te">{lesson.practice.promptTe}</p>}</div>
              <div className="answer-grid">
                {lesson.practice.options.map((option, index) => {
                  const chosen = selected === index;
                  const revealCorrect = selected !== null && index === lesson.practice.answer;
                  const wrong = chosen && !revealCorrect;
                  return <button type="button" key={option} className={`answer-option ${chosen ? "chosen" : ""} ${revealCorrect ? "correct" : ""} ${wrong ? "wrong" : ""}`} onClick={() => setSelected(index)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>;
                })}
              </div>
              <div className={`answer-feedback ${selected === null ? "waiting" : isCorrect ? "success" : "retry"}`} aria-live="polite">{selected === null ? "Choose an answer to see feedback." : isCorrect ? `Correct. ${lesson.practice.explanation}` : `Not quite. ${lesson.practice.explanation}`}</div>
            </div>
          </section>

          <section className="speak-card section-block">
            <div className="speak-mark">“</div>
            <div><p className="kicker">Speak out loud</p><h2>{lesson.speak}</h2>{language !== "en" && <p lang="te">{lesson.speakTe}</p>}</div>
            <div className="speak-audio-group">
              {language !== "te" && <button type="button" className={`round-audio ${speaking === "speak-en" ? "playing" : ""}`} onClick={() => playAudio(audioPath("speak", "en"), "speak-en")} aria-label="Listen to speaking activity in English"><SpeakerIcon /><span>EN</span></button>}
              {language !== "en" && <button type="button" className={`round-audio ${speaking === "speak-te" ? "playing" : ""}`} onClick={() => playAudio(audioPath("speak", "te"), "speak-te")} aria-label="Listen to speaking activity in Telugu"><SpeakerIcon /><span>తె</span></button>}
            </div>
          </section>

          <section className="speech-coach section-block">
            <div className="speech-coach-copy">
              <p className="kicker">English speaking coach</p>
              <h2>Listen. Speak. Improve.</h2>
              <p className="speech-coach-telugu" lang="te">ముందు వినండి. తర్వాత అదే వాక్యాన్ని స్పష్టంగా చెప్పండి.</p>
            </div>
            <div className="speech-target">
              <span>Today’s sentence</span>
              <blockquote>“{speakingTarget}”</blockquote>
              <button type="button" className={`model-audio ${speaking === "coach-model" ? "playing" : ""}`} onClick={() => playAudio(audioPath("example-01", "en"), "coach-model")}><SpeakerIcon />{speaking === "coach-model" ? "Stop model" : "Hear the model"}</button>
            </div>
            <div className="speech-action-panel">
              <button type="button" className={`record-button ${speechCoachStatus === "listening" ? "listening" : ""}`} onClick={startSpeechCoach} disabled={speechCoachStatus === "listening"}><MicrophoneIcon />{speechCoachStatus === "listening" ? "Listening…" : speechCoachStatus === "result" ? "Try again" : "Start speaking"}</button>
              {speechCoachStatus === "idle" && <p>Tap the microphone and say the sentence.</p>}
              {speechCoachStatus === "listening" && <p>Speak now. We’re listening.</p>}
              {speechCoachStatus === "unsupported" && <p className="speech-error">Speech recognition is not available here. Open the installed app in Chrome.</p>}
              {speechCoachStatus === "error" && <p className="speech-error">We could not hear you. Check microphone permission and try again.</p>}
              {speechCoachStatus === "result" && speechScore !== null && (
                <div className="speech-result" aria-live="polite">
                  <div className="score-line"><strong>{speechScore}%</strong><span>{speechScore >= 85 ? "Excellent speaking!" : speechScore >= 65 ? "Good—try once more." : "Say it slowly and try again."}</span></div>
                  <div className="score-rail"><span style={{ width: `${speechScore}%` }} /></div>
                  <p><b>We heard:</b> {spokenText}</p>
                  <small lang="te">{speechScore >= 85 ? "చాలా బాగా చెప్పారు!" : speechScore >= 65 ? "బాగుంది—మరొక్కసారి ప్రయత్నించండి." : "నెమ్మదిగా స్పష్టంగా చెప్పండి."}</small>
                </div>
              )}
            </div>
          </section>

          <footer className="lesson-footer">
            <button type="button" className={`complete-button ${completed.includes(lesson.day) ? "done" : ""}`} onClick={toggleComplete}><span>{completed.includes(lesson.day) && <CheckIcon />}</span>{completed.includes(lesson.day) ? "Lesson completed" : "Mark lesson complete"}</button>
            <div className="lesson-pagination"><button type="button" onClick={() => goToLesson(current - 1)} disabled={current === 0}>← Previous</button><button type="button" className="next-button" onClick={() => goToLesson(current === lessons.length - 1 ? 0 : current + 1)}>{current === lessons.length - 1 ? "Start again ↻" : "Next lesson →"}</button></div>
          </footer>
        </main>
      </div>
    </div>
  );
}
