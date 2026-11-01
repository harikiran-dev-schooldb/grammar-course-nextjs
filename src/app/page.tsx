"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LanguageMode, lessons, units } from "@/data/lessons";
import { conversations } from "@/data/conversations";
import { wordPower } from "@/data/word-power";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type OfflineStatus = "idle" | "downloading" | "ready" | "error";
type SkillTab = "listen" | "read" | "write" | "translate";
type LearnerProfile = { name: string; pinHash: string };

async function hashPin(pin: string) {
  const bytes = new TextEncoder().encode(`grammar-studio:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function SpeakerIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm12.5-1.5a6 6 0 0 1 0 9M18.8 5a9 9 0 0 1 0 14" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

export default function Home() {
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [learnerName, setLearnerName] = useState<string | null>(null);
  const [authName, setAuthName] = useState("");
  const [authPin, setAuthPin] = useState("");
  const [authError, setAuthError] = useState("");
  const [current, setCurrent] = useState(0);
  const [language, setLanguage] = useState<LanguageMode>("both");
  const [completed, setCompleted] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>("idle");
  const [offlineProgress, setOfflineProgress] = useState({ completed: 0, total: 420 });
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [conversationChoice, setConversationChoice] = useState<number | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [spellingMode, setSpellingMode] = useState<"learn" | "quiz">("learn");
  const [spellingInput, setSpellingInput] = useState("");
  const [spellingChecked, setSpellingChecked] = useState(false);
  const [skillTab, setSkillTab] = useState<SkillTab>("listen");
  const [listeningAnswer, setListeningAnswer] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [readingAnswer, setReadingAnswer] = useState<number | null>(null);
  const [writingText, setWritingText] = useState("");
  const [writingSaved, setWritingSaved] = useState(false);
  const [translationText, setTranslationText] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [skillsDone, setSkillsDone] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lesson = lessons[current];
  const conversation = conversations[current];
  const words = wordPower[current];
  const activeWord = words[wordIndex];

  const activity = useMemo(() => {
    const correctReply = conversation.options[conversation.best];
    const settings = [
      conversation.setting,
      conversations[(current + 1) % conversations.length].setting,
      conversations[(current + 2) % conversations.length].setting,
    ];
    const shift = current % 3;
    const listeningOptions = settings.map((_, index) => settings[(index + shift) % settings.length]);
    return {
      transcript: `${conversation.partner} ${correctReply.text} ${correctReply.reply}`,
      listeningOptions,
      listeningAnswer: listeningOptions.indexOf(conversation.setting),
      readingPassage: `“${conversation.partner}”\n“${correctReply.text}”\n“${correctReply.reply}”`,
    };
  }, [conversation, current]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = window.localStorage.getItem("grammar-studio-learner-profile");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as LearnerProfile;
          setProfile(parsed);
          setAuthName(parsed.name);
          if (window.sessionStorage.getItem("grammar-studio-authenticated") === "yes") setLearnerName(parsed.name);
        } catch { window.localStorage.removeItem("grammar-studio-learner-profile"); }
      }
      setAuthReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

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
    if (!learnerName) return;
    const frame = window.requestAnimationFrame(() => {
      const learnerKey = learnerName.trim().toLocaleLowerCase("en");
      const storedSkills = window.localStorage.getItem(`grammar-studio-skills-${learnerKey}`);
      if (storedSkills) {
        try { setSkillsDone(JSON.parse(storedSkills)); } catch { setSkillsDone([]); }
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [learnerName]);

  useEffect(() => {
    if (!learnerName) return;
    const frame = window.requestAnimationFrame(() => {
      const learnerKey = learnerName.trim().toLocaleLowerCase("en");
      setWritingText(window.localStorage.getItem(`grammar-studio-writing-${learnerKey}-${current + 1}`) || "");
      setWritingSaved(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [current, learnerName]);

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
        const ready = await caches.match("/__grammar_studio_complete_english_ready_v5__");
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
    setSkillTab("listen");
    setListeningAnswer(null);
    setShowTranscript(false);
    setReadingAnswer(null);
    setTranslationText("");
    setShowTranslation(false);
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
    setOfflineProgress({ completed: 0, total: 420 });
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
  const writingWordCount = writingText.trim() ? writingText.trim().split(/\s+/).length : 0;

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

  const markSkill = (skill: SkillTab) => {
    if (!learnerName) return;
    const key = `${skill}-${lesson.day}`;
    const updated = skillsDone.includes(key) ? skillsDone : [...skillsDone, key];
    setSkillsDone(updated);
    const learnerKey = learnerName.trim().toLocaleLowerCase("en");
    window.localStorage.setItem(`grammar-studio-skills-${learnerKey}`, JSON.stringify(updated));
  };

  const saveWriting = () => {
    if (!learnerName || writingText.trim().split(/\s+/).filter(Boolean).length < 5) return;
    const learnerKey = learnerName.trim().toLocaleLowerCase("en");
    window.localStorage.setItem(`grammar-studio-writing-${learnerKey}-${lesson.day}`, writingText.trim());
    setWritingSaved(true);
    markSkill("write");
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = authName.trim();
    if (name.length < 2) { setAuthError("Please enter your name."); return; }
    if (!/^\d{4}$/.test(authPin)) { setAuthError("Enter a 4-digit PIN."); return; }
    const pinHash = await hashPin(authPin);

    if (profile) {
      if (pinHash !== profile.pinHash) { setAuthError("That PIN is not correct. Please try again."); return; }
      setLearnerName(profile.name);
    } else {
      const newProfile = { name, pinHash };
      window.localStorage.setItem("grammar-studio-learner-profile", JSON.stringify(newProfile));
      setProfile(newProfile);
      setLearnerName(name);
    }
    window.sessionStorage.setItem("grammar-studio-authenticated", "yes");
    setAuthPin("");
    setAuthError("");
  };

  const logout = () => {
    window.sessionStorage.removeItem("grammar-studio-authenticated");
    setLearnerName(null);
    setAuthPin("");
    setAuthError("");
  };

  if (!authReady) return <div className="app-loading"><span className="brand-mark">G</span><p>Preparing your English course…</p></div>;

  if (!learnerName) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-brand"><span className="brand-mark">G</span><div><strong>Grammar Studio</strong><small>Complete English · సంపూర్ణ ఇంగ్లీష్</small></div></div>
          <p className="kicker">{profile ? "Welcome back" : "Create your learner profile"}</p>
          <h1>{profile ? `Hello, ${profile.name}` : "Learn English one day at a time."}</h1>
          <p className="login-intro">Grammar, listening, reading, writing, conversations, vocabulary, spelling, and translation—in one offline-friendly course.</p>
          <p className="login-intro telugu" lang="te">Grammar మాత్రమే కాదు—English లో వినడం, చదవడం, రాయడం, మాట్లాడడం అన్నీ practice చేయండి.</p>
          <form onSubmit={submitAuth}>
            {!profile && <label>Your name<input value={authName} onChange={(event) => setAuthName(event.target.value)} autoComplete="name" placeholder="Enter your name" /></label>}
            <label>4-digit PIN<input value={authPin} onChange={(event) => setAuthPin(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoComplete={profile ? "current-password" : "new-password"} type="password" placeholder="••••" /></label>
            {authError && <p className="auth-error" role="alert">{authError}</p>}
            <button type="submit">{profile ? "Open my course" : "Create profile & start"}</button>
          </form>
          <div className="local-profile-note"><CheckIcon /><span><strong>Works offline.</strong> Your profile and progress stay on this device; nothing is uploaded.</span></div>
        </section>
        <aside className="login-preview" aria-hidden="true"><span>30 days</span><h2>From beginner basics to confident everyday English.</h2><div className="login-skill-list"><b>Listen</b><b>Read</b><b>Write</b><b>Speak</b></div></aside>
      </main>
    );
  }

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
        <button type="button" className="account-button" onClick={logout} title="Log out of this device"><span>{learnerName.charAt(0).toUpperCase()}</span><small>{learnerName}</small><b>Log out</b></button>
      </header>

      <div className="course-layout">
        <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
          <div className="sidebar-intro">
            <p className="kicker">30-day complete English course</p><h2>Every skill.<br />Real progress.</h2><p>Grammar, listening, reading, writing, speaking, vocabulary, and translation—together each day.</p>
            <section className={`offline-card ${offlineStatus}`} aria-live="polite">
              <div className="offline-card-heading"><strong>Offline course</strong><span className={isOnline ? "online" : "offline"}>{isOnline ? "Online" : "Offline"}</span></div>
              <p>{offlineStatus === "ready" ? "The complete course and all neural audio are ready offline. అన్ని పాఠాలు సిద్ధం." : offlineStatus === "downloading" ? `Downloading neural audio ${offlineProgress.completed} / ${offlineProgress.total}…` : offlineStatus === "error" ? "Download paused. Connect to the internet and try again." : "Save every activity and all 420 audio clips to this device (about 12 MB)."}</p>
              {offlineStatus !== "ready" && <button type="button" onClick={downloadForOffline} disabled={!isOnline || offlineStatus === "downloading"}>{offlineStatus === "downloading" ? "Downloading…" : offlineStatus === "error" ? "Try again" : "Download offline"}</button>}
              {offlineStatus === "downloading" && <div className="offline-progress"><span style={{ width: `${Math.round((offlineProgress.completed / offlineProgress.total) * 100)}%` }} /></div>}
              {!isInstalled && installPrompt && <button type="button" className="install-button" onClick={installApp}>Install app</button>}
              {isInstalled && <small>Installed as an app ✓</small>}
            </section>
            <section className="learning-path-card">
              <div><p className="kicker">Your learning path</p><strong>{lesson.day <= 10 ? "Beginner foundations" : lesson.day <= 20 ? "Everyday English" : "Confident English"}</strong></div>
              <div className="path-stages">
                {[{name:"Beginner",start:1,end:10},{name:"Everyday",start:11,end:20},{name:"Confident",start:21,end:30}].map((stage) => {
                  const count = completed.filter((day) => day >= stage.start && day <= stage.end).length;
                  return <div key={stage.name}><span>{stage.name}</span><b>{count}/10</b><i><em style={{width:`${count * 10}%`}} /></i></div>;
                })}
              </div>
              <small>{skillsDone.length} of 120 language activities completed</small>
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

          <section className="skills-lab section-block">
            <div className="skills-lab-header">
              <div><p className="kicker">Complete English practice</p><h2>Build every language skill</h2><p lang="te">వినడం, చదవడం, రాయడం, అనువాదం—ప్రతి lesson లో practice చేయండి.</p></div>
              <div className="skills-score"><strong>{skillsDone.length}</strong><span>/ 120 activities</span></div>
            </div>

            <div className="skill-tabs" role="tablist" aria-label="English skill activities">
              {([
                ["listen", "Listening", "వినడం"],
                ["read", "Reading", "చదవడం"],
                ["write", "Writing", "రాయడం"],
                ["translate", "Translation", "అనువాదం"],
              ] as [SkillTab, string, string][]).map(([tab, label, labelTe]) => (
                <button type="button" role="tab" aria-selected={skillTab === tab} className={skillTab === tab ? "active" : ""} key={tab} onClick={() => setSkillTab(tab)}>
                  <span>{skillsDone.includes(`${tab}-${lesson.day}`) ? <CheckIcon /> : label.charAt(0)}</span><b>{label}</b><small lang="te">{labelTe}</small>
                </button>
              ))}
            </div>

            {skillTab === "listen" && (
              <div className="skill-panel listening-panel">
                <div className="skill-instruction">
                  <span className="skill-number">01</span><p className="kicker">Listen first</p><h3>Which situation best matches the dialogue?</h3><p lang="te">ముందు transcript చూడకుండా audio వినండి. సరైన situation ఎంచుకోండి.</p>
                  <button type="button" className={`primary-skill-audio ${speaking === "listening-en" ? "playing" : ""}`} onClick={() => speaking === "listening-en" ? stopSpeaking() : playAudio(audioPath("listening", "en"), "listening-en")}><SpeakerIcon />{speaking === "listening-en" ? "Stop audio" : "Play dialogue"}</button>
                </div>
                <div className="skill-workspace">
                  <div className="skill-options">
                    {activity.listeningOptions.map((option, index) => <button type="button" key={option} className={listeningAnswer === null ? "" : index === activity.listeningAnswer ? "correct" : listeningAnswer === index ? "wrong" : ""} onClick={() => { setListeningAnswer(index); if (index === activity.listeningAnswer) markSkill("listen"); }}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}
                  </div>
                  {listeningAnswer !== null && <p className={`skill-feedback ${listeningAnswer === activity.listeningAnswer ? "success" : "retry"}`}>{listeningAnswer === activity.listeningAnswer ? "Correct—listen once more and notice every word. చాలా బాగుంది!" : "Listen again and focus on the setting. మరొక్కసారి వినండి."}</p>}
                  <button type="button" className="text-action" onClick={() => setShowTranscript((shown) => !shown)}>{showTranscript ? "Hide transcript" : "Show transcript after listening"}</button>
                  {showTranscript && <div className="transcript-box"><span>Transcript</span><p>{activity.transcript}</p><small lang="te">ఈ dialogue యొక్క situation: {conversation.settingTe}</small></div>}
                </div>
              </div>
            )}

            {skillTab === "read" && (
              <div className="skill-panel reading-panel">
                <article className="reading-passage"><span className="skill-number">02</span><p className="kicker">Read slowly</p><h3>{conversation.title}</h3>{activity.readingPassage.split("\n").map((line) => <p key={line}>{line}</p>)}</article>
                <div className="skill-workspace"><h3>Which reply makes the conversation natural?</h3><p lang="te">Conversation natural గా ఉండే reply ఎంచుకోండి.</p><div className="skill-options">{conversation.options.map((option, index) => <button type="button" key={option.text} className={readingAnswer === null ? "" : index === conversation.best ? "correct" : readingAnswer === index ? "wrong" : ""} onClick={() => { setReadingAnswer(index); if (index === conversation.best) markSkill("read"); }}><span>{String.fromCharCode(65 + index)}</span>{option.text}</button>)}</div>{readingAnswer !== null && <p className={`skill-feedback ${readingAnswer === conversation.best ? "success" : "retry"}`}>{readingAnswer === conversation.best ? `Correct. ${conversation.tip}` : `Try again. ${conversation.tip}`}</p>}</div>
              </div>
            )}

            {skillTab === "write" && (
              <div className="skill-panel writing-panel">
                <div className="skill-instruction"><span className="skill-number">03</span><p className="kicker">Write in your own words</p><h3>{lesson.speak}</h3><p lang="te">{lesson.speakTe}</p><div className="writing-tips"><span>Use 5+ words</span><span>Check capital letters</span><span>Finish with punctuation</span></div></div>
                <div className="skill-workspace"><label htmlFor="daily-writing">Your writing</label><textarea id="daily-writing" value={writingText} onChange={(event) => {setWritingText(event.target.value); setWritingSaved(false);}} placeholder="Write your answer in English…" /><div className="writing-footer"><span className={writingWordCount >= 5 ? "ready" : ""}>{writingWordCount} words</span><button type="button" onClick={saveWriting} disabled={writingWordCount < 5}>Save writing</button></div>{writingSaved && <p className="skill-feedback success">Saved on this device. మీ writing save అయింది.</p>}</div>
              </div>
            )}

            {skillTab === "translate" && (
              <div className="skill-panel translation-panel">
                <div className="skill-instruction"><span className="skill-number">04</span><p className="kicker">English → తెలుగు</p><h3>{lesson.examples[0].en}</h3><p lang="te">ఈ sentence ను సహజమైన తెలుగులో రాయండి. Exact word-to-word translation అవసరం లేదు.</p></div>
                <div className="skill-workspace"><label htmlFor="translation-answer">Your Telugu translation</label><textarea id="translation-answer" lang="te" value={translationText} onChange={(event) => setTranslationText(event.target.value)} placeholder="తెలుగులో రాయండి…" /><button type="button" className="reveal-model" onClick={() => {setShowTranslation(true); markSkill("translate");}} disabled={!translationText.trim()}>Compare with teacher’s answer</button>{showTranslation && <div className="model-translation"><span>Teacher’s natural translation</span><p lang="te">{lesson.examples[0].te}</p><small>Your wording can be different if the meaning is the same.</small></div>}</div>
              </div>
            )}
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
