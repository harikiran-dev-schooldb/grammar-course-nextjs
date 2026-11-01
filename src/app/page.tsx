"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageMode, lessons, units } from "@/data/lessons";
import { conversations } from "@/data/conversations";
import { wordPower } from "@/data/word-power";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type OfflineStatus = "idle" | "downloading" | "ready" | "error";

function SpeakerIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm12.5-1.5a6 6 0 0 1 0 9M18.8 5a9 9 0 0 1 0 14" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [language, setLanguage] = useState<LanguageMode>("both");
  const [completed, setCompleted] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>("idle");
  const [offlineProgress, setOfflineProgress] = useState({ completed: 0, total: 390 });
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [conversationChoice, setConversationChoice] = useState<number | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [spellingMode, setSpellingMode] = useState<"learn" | "quiz">("learn");
  const [spellingInput, setSpellingInput] = useState("");
  const [spellingChecked, setSpellingChecked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lesson = lessons[current];
  const conversation = conversations[current];
  const words = wordPower[current];
  const activeWord = words[wordIndex];

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
        const ready = await caches.match("/__grammar_studio_word_power_ready_v4__");
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
    setConversationChoice(null);
    setWordIndex(0);
    setSpellingMode("learn");
    setSpellingInput("");
    setSpellingChecked(false);
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
    setOfflineProgress({ completed: 0, total: 390 });
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({ type: "CACHE_ALL_AUDIO" });
  };

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const isCorrect = selected === lesson.practice.answer;
  const spellingIsCorrect = spellingInput.trim().toLocaleLowerCase("en") === activeWord.word.toLocaleLowerCase("en");

  const selectWord = (index: number) => {
    setWordIndex(index);
    setSpellingMode("learn");
    setSpellingInput("");
    setSpellingChecked(false);
  };

  const startSpellingQuiz = () => {
    setSpellingMode("quiz");
    setSpellingInput("");
    setSpellingChecked(false);
    playAudio(audioPath(`word-${String(wordIndex + 1).padStart(2, "0")}`, "en"), `word-${wordIndex + 1}`);
  };

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
              <p>{offlineStatus === "ready" ? "All 30 lessons, word practice, and neural audio are ready offline. అన్ని పాఠాలు సిద్ధం." : offlineStatus === "downloading" ? `Downloading neural audio ${offlineProgress.completed} / ${offlineProgress.total}…` : offlineStatus === "error" ? "Download paused. Connect to the internet and try again." : "Save all lessons, pronunciation practice, and 390 audio clips to this device (about 11 MB)."}</p>
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

          <section className="conversation-lab section-block">
            <div className="conversation-header">
              <div>
                <p className="kicker">Conversation lab</p>
                <h2>Choose what you would say</h2>
                <p lang="te">ఈ సందర్భంలో మీరు ఏమి చెబుతారో ఎంచుకోండి.</p>
              </div>
              <span className="conversation-day">Day {lesson.day}</span>
            </div>

            <div className="scenario-meta">
              <span>{conversation.setting}</span>
              <span lang="te">{conversation.settingTe}</span>
            </div>

            <div className="conversation-stage">
              <article className="partner-bubble">
                <span className="speaker-label">Your partner says</span>
                <h3>{conversation.title}</h3>
                <p className="conversation-prompt">“{conversation.partner}”</p>
                <p className="conversation-prompt-te" lang="te">{conversation.partnerTe}</p>
              </article>

              <div className="choice-list">
                <span className="speaker-label">Your turn</span>
                {conversation.options.map((option, index) => {
                  const chosen = conversationChoice === index;
                  const correct = conversationChoice !== null && index === conversation.best;
                  const wrong = chosen && index !== conversation.best;
                  return (
                    <button
                      type="button"
                      key={option.text}
                      className={`conversation-choice ${chosen ? "chosen" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}
                      onClick={() => setConversationChoice(index)}
                    >
                      <span>{String.fromCharCode(65 + index)}</span>
                      {option.text}
                    </button>
                  );
                })}
              </div>
            </div>

            {conversationChoice !== null && (
              <div className={`conversation-result ${conversationChoice === conversation.best ? "success" : "retry"}`} aria-live="polite">
                <div className="conversation-reply">
                  <span>Partner replies</span>
                  <p>“{conversation.options[conversationChoice].reply}”</p>
                </div>
                <div className="conversation-feedback">
                  <strong>{conversationChoice === conversation.best ? "Natural and correct!" : "Good try—choose the most natural sentence."}</strong>
                  <p>{conversation.tip}</p>
                  <p lang="te">{conversation.tipTe}</p>
                  <button type="button" onClick={() => setConversationChoice(null)}>Practice again</button>
                </div>
              </div>
            )}
          </section>

          <section className="word-power section-block">
            <div className="word-power-header">
              <div>
                <p className="kicker">Word power · పదాల సాధన</p>
                <h2>Learn the spelling and pronunciation</h2>
                <p lang="te">పదాన్ని వినండి, పలకండి, తర్వాత spelling practice చేయండి.</p>
              </div>
              <span className="word-count">3 words</span>
            </div>

            <div className="word-tabs" role="tablist" aria-label="Words for this lesson">
              {words.map((item, index) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={wordIndex === index}
                  className={wordIndex === index ? "active" : ""}
                  key={item.word}
                  onClick={() => selectWord(index)}
                >
                  <span>{index + 1}</span>{spellingMode === "quiz" && wordIndex === index ? "Your word" : item.word}
                </button>
              ))}
            </div>

            {spellingMode === "learn" ? (
              <div className="word-learning-card">
                <div className="word-main">
                  <span className="learning-label">Look · Listen · Repeat</span>
                  <h3>{activeWord.word}</h3>
                  <p className="pronunciation-guide">Say it: <strong>{activeWord.pronunciation}</strong></p>
                  <div className="syllable-row" aria-label={`Spelling parts: ${activeWord.syllables.join(", ")}`}>
                    {activeWord.syllables.map((part) => <span key={part}>{part}</span>)}
                  </div>
                  <p className="word-meaning" lang="te">తెలుగు అర్థం: <strong>{activeWord.meaningTe}</strong></p>
                </div>
                <div className="word-actions">
                  <button
                    type="button"
                    className={`word-listen ${speaking === `word-${wordIndex + 1}` ? "playing" : ""}`}
                    onClick={() => speaking === `word-${wordIndex + 1}` ? stopSpeaking() : playAudio(audioPath(`word-${String(wordIndex + 1).padStart(2, "0")}`, "en"), `word-${wordIndex + 1}`)}
                  >
                    <SpeakerIcon />{speaking === `word-${wordIndex + 1}` ? "Stop" : "Hear pronunciation"}
                  </button>
                  <button type="button" className="start-spelling" onClick={startSpellingQuiz}>I’m ready — spell it</button>
                </div>
              </div>
            ) : (
              <div className="spelling-quiz" aria-live="polite">
                <div className="spelling-prompt">
                  <span className="learning-label">Hear it. Type it.</span>
                  <h3>What word do you hear?</h3>
                  <p lang="te">Audio విని, ఆ word spelling టైప్ చేయండి.</p>
                  <button type="button" className={`word-listen ${speaking === `word-${wordIndex + 1}` ? "playing" : ""}`} onClick={() => playAudio(audioPath(`word-${String(wordIndex + 1).padStart(2, "0")}`, "en"), `word-${wordIndex + 1}`)}><SpeakerIcon />Play again</button>
                </div>
                <div className="spelling-answer">
                  <label htmlFor="spelling-input">Type the spelling</label>
                  <div className="spelling-input-row">
                    <input
                      id="spelling-input"
                      value={spellingInput}
                      onChange={(event) => { setSpellingInput(event.target.value); setSpellingChecked(false); }}
                      onKeyDown={(event) => { if (event.key === "Enter" && spellingInput.trim()) setSpellingChecked(true); }}
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="Type what you heard"
                    />
                    <button type="button" onClick={() => setSpellingChecked(true)} disabled={!spellingInput.trim()}>Check</button>
                  </div>
                  {spellingChecked && (
                    <div className={`spelling-feedback ${spellingIsCorrect ? "correct" : "retry"}`}>
                      <strong>{spellingIsCorrect ? "Correct — excellent!" : `Almost. The spelling is “${activeWord.word}”.`}</strong>
                      <span lang="te">{spellingIsCorrect ? "చాలా బాగా చేశారు!" : "మరొక్కసారి విని, పదాన్ని నెమ్మదిగా టైప్ చేయండి."}</span>
                    </div>
                  )}
                  <div className="spelling-controls">
                    <button type="button" onClick={() => setSpellingMode("learn")}>Back to learn</button>
                    <button type="button" onClick={() => selectWord((wordIndex + 1) % words.length)}>Next word →</button>
                  </div>
                </div>
              </div>
            )}
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
