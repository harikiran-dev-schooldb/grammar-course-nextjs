"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LanguageMode, lessons, units } from "@/data/lessons";
import { conversations } from "@/data/conversations";
import { wordPower } from "@/data/word-power";
import SpeakingRecorder from "@/components/speaking-recorder";
import DailyTestHub from "@/components/daily-test-hub";
import { authClient } from "@/lib/auth-client";
import { claimUsername, getMyUsername, requestLegacyPasswordReset, requestUsernamePasswordReset, signInWithUsername } from "@/app/actions/username-auth";
import { isValidUsername, normalizeUsername } from "@/lib/usernames";
import { CloudProgress, emptyProgress, mergeProgress, Mistake, parseCompletedDays, parseSavedDayIndex } from "@/lib/progress";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type OfflineStatus = "idle" | "downloading" | "ready" | "error";
type SkillTab = "listen" | "read" | "write" | "translate";
type HubView = "dashboard" | "revision" | "test" | "certificate";

const todayKey = () => new Date().toLocaleDateString("en-CA");

function calculateStreak(dates: string[], today: string) {
  if (!today) return 0;
  const days = new Set(dates);
  const cursor = new Date(`${today}T12:00:00`);
  if (!days.has(today)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(cursor.toLocaleDateString("en-CA"))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function SpeakerIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm12.5-1.5a6 6 0 0 1 0 9M18.8 5a9 9 0 0 1 0 14" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>;
}

export default function Home() {
  const [authReady, setAuthReady] = useState(false);
  const [learnerName, setLearnerName] = useState<string | null>(null);
  const [learnerEmail, setLearnerEmail] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [authUsername, setAuthUsername] = useState("");
  const [emailFallback, setEmailFallback] = useState(false);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [skipUsernameSetup, setSkipUsernameSetup] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [today, setToday] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"local" | "syncing" | "synced" | "error">("local");
  const [current, setCurrent] = useState(0);
  const [language, setLanguage] = useState<LanguageMode>("both");
  const [completed, setCompleted] = useState<number[]>([]);
  const [progressReady, setProgressReady] = useState(false);
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
  const [writings, setWritings] = useState<Record<string, string>>({});
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [activityDates, setActivityDates] = useState<string[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [hubView, setHubView] = useState<HubView | null>(null);
  const [testAnswers, setTestAnswers] = useState<Record<number, number>>({});
  const [testScore, setTestScore] = useState<number | null>(null);
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
    let active = true;
    void authClient.getSession().then(({ data }) => {
      if (!active) return;
      if (data?.user) {
        setLearnerName(data.user.name || data.user.email.split("@")[0]);
        setLearnerEmail(data.user.email);
        void getMyUsername().then((username) => {
          if (!active) return;
          setNeedsUsername(!username);
          if (username) setAuthUsername(username);
        });
      }
    }).catch(() => undefined).finally(() => { if (active) setAuthReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      // Read existing progress before enabling writes, otherwise the first render
      // replaces the learner's saved progress with the default empty array.
      try {
        const validDays = lessons.map((item) => item.day);
        const cloudLocal = window.localStorage.getItem("grammar-studio-cloud-progress");
        if (cloudLocal) {
          const saved = JSON.parse(cloudLocal) as CloudProgress;
          setCompleted(parseCompletedDays(JSON.stringify(saved.completed || []), validDays));
          setCurrent(Math.max(0, Math.min(29, (saved.currentDay || 1) - 1)));
          setSkillsDone(saved.skillsDone || []);
          setWritings(saved.writings || {});
          setMistakes(saved.mistakes || []);
          setActivityDates(saved.activityDates || []);
          setBadges(saved.badges || []);
        } else {
          setCompleted(parseCompletedDays(window.localStorage.getItem("grammar-studio-progress"), validDays));
          setCurrent(parseSavedDayIndex(window.localStorage.getItem("grammar-studio-day"), validDays));
        }
      } catch {
        // Browsers can block localStorage or contain malformed legacy data.
        window.localStorage.removeItem("grammar-studio-cloud-progress");
      }
      setProgressReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!progressReady) return;
    try {
      window.localStorage.setItem("grammar-studio-progress", JSON.stringify(completed));
      window.localStorage.setItem("grammar-studio-day", String(current + 1));
    } catch {
      // Storage may be disabled or full; do not crash the learning interface.
    }
  }, [completed, current, progressReady]);

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
      setWritingText((currentText) => writings[String(current + 1)] || currentText);
      setWritingSaved(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [current, learnerName, writings]);

  useEffect(() => {
    if (!learnerName || cloudLoaded) return;
    let active = true;
    const savedRaw = window.localStorage.getItem("grammar-studio-cloud-progress");
    let local = emptyProgress(learnerName);
    if (savedRaw) {
      try { local = { ...local, ...(JSON.parse(savedRaw) as CloudProgress), displayName: learnerName }; } catch { /* use current state */ }
    } else {
      local = { ...local, completed, currentDay: current + 1, skillsDone, writings, mistakes, activityDates, badges };
    }
    void fetch("/api/progress", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Cloud progress unavailable");
      const merged = mergeProgress(local, await response.json() as CloudProgress);
      if (!active) return;
      setCompleted(merged.completed);
      setCurrent(Math.max(0, Math.min(29, merged.currentDay - 1)));
      setSkillsDone(merged.skillsDone);
      setWritings(merged.writings);
      setMistakes(merged.mistakes);
      setActivityDates([...new Set([...merged.activityDates, todayKey()])]);
      setBadges(merged.badges);
      setSyncStatus("synced");
    }).catch(() => {
      if (active) {
        setActivityDates((dates) => [...new Set([...dates, todayKey()])]);
        setSyncStatus(navigator.onLine ? "error" : "local");
      }
    }).finally(() => { if (active) setCloudLoaded(true); });
    return () => { active = false; };
    // Run once for each authenticated learner; later updates use the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnerName, cloudLoaded]);

  useEffect(() => {
    if (!learnerName || !cloudLoaded) return;
    const snapshot: CloudProgress = { displayName: learnerName, completed, currentDay: current + 1, skillsDone, writings, mistakes, activityDates, badges };
    window.localStorage.setItem("grammar-studio-cloud-progress", JSON.stringify(snapshot));
    const timer = window.setTimeout(() => {
      if (!navigator.onLine) { setSyncStatus("local"); return; }
      setSyncStatus("syncing");
      void fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(snapshot) })
        .then((response) => { if (!response.ok) throw new Error("Sync failed"); setSyncStatus("synced"); })
        .catch(() => setSyncStatus("error"));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [activityDates, badges, cloudLoaded, completed, current, learnerName, mistakes, skillsDone, writings]);

  useEffect(() => {
    const environmentFrame = window.requestAnimationFrame(() => {
      setIsOnline(window.navigator.onLine);
      setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
      setToday(todayKey());
      setDisplayDate(new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }));
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
      }).catch(() => setOfflineStatus("error"));
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
  const writingWordCount = writingText.trim() ? writingText.trim().split(/\s+/).length : 0;
  const streak = calculateStreak(activityDates, today);
  const reviewItems = mistakes.filter((item) => !item.reviewed).sort((a, b) => b.attempts - a.attempts);
  const achievementBadges = [
    ...(completed.length >= 1 ? ["First lesson"] : []),
    ...(completed.length >= 10 ? ["10-day explorer"] : []),
    ...(completed.length >= 20 ? ["20-day builder"] : []),
    ...(completed.length === 30 ? ["Course champion"] : []),
    ...(skillsDone.length >= 40 ? ["Skills starter"] : []),
    ...(skillsDone.length >= 100 ? ["Skills master"] : []),
    ...(streak >= 3 ? ["3-day streak"] : []),
    ...(streak >= 7 ? ["7-day streak"] : []),
  ];
  const allBadges = [...new Set([...badges, ...achievementBadges])];
  const testQuestions = useMemo(() => lessons.filter((_, index) => index % 3 === 0).slice(0, 10), []);
  const writingFeedback = useMemo(() => {
    const text = writingText.trim();
    if (!text) return [];
    const notes: string[] = [];
    if (!/^[A-Z]/.test(text)) notes.push("Start your first sentence with a capital letter.");
    if (!/[.!?]$/.test(text)) notes.push("Finish your answer with a full stop, question mark, or exclamation mark.");
    if (/\bi\b/.test(text)) notes.push("Write the pronoun “I” with a capital letter.");
    if (/\b(he|she|it) (go|do|have)\b/i.test(text)) notes.push("Check the verb after he/she/it: goes, does, or has.");
    if (/(\b\w+\b)(\s+\1\b)/i.test(text)) notes.push("A word is repeated. Read the sentence once and remove the duplicate.");
    if (writingWordCount < 8) notes.push("Add one more detail to make your answer clearer.");
    return notes.length ? notes : ["Clear writing—capital letters, grammar, and punctuation look good."];
  }, [writingText, writingWordCount]);
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
    setActivityDates((dates) => [...new Set([...dates, todayKey()])]);
  };

  const rememberMistake = (type: Mistake["type"], prompt: string, answer: string) => {
    const id = `${type}-${lesson.day}-${prompt.slice(0, 32)}`;
    setMistakes((items) => {
      const existing = items.find((item) => item.id === id);
      if (existing) return items.map((item) => item.id === id ? { ...item, attempts: item.attempts + 1, reviewed: false, lastSeen: new Date().toISOString() } : item);
      return [...items, { id, type, day: lesson.day, prompt, answer, attempts: 1, reviewed: false, lastSeen: new Date().toISOString() }].slice(-100);
    });
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
    try {
      const registration = await navigator.serviceWorker.ready;
      const worker = registration.active ?? navigator.serviceWorker.controller;
      if (!worker) throw new Error("No active service worker");
      worker.postMessage({ type: "CACHE_ALL_AUDIO" });
    } catch {
      setOfflineStatus("error");
    }
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

  const checkSpelling = () => {
    setSpellingChecked(true);
    if (!spellingIsCorrect) rememberMistake("spelling", `Spell the word you heard: ${activeWord.meaningTe}`, activeWord.word);
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
    setWritings((items) => ({ ...items, [String(lesson.day)]: writingText.trim() }));
    setWritingSaved(true);
    markSkill("write");
  };

  const submitFinalTest = () => {
    const correct = testQuestions.filter((item) => testAnswers[item.day] === item.practice.answer).length;
    const score = Math.round((correct / testQuestions.length) * 100);
    setTestScore(score);
    if (score >= 80) setBadges((items) => [...new Set([...items, "Final test passed"])]);
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = authName.trim();
    const email = learnerEmail.trim().toLowerCase();
    const username = normalizeUsername(authUsername);
    setAuthError("");
    setAuthNotice("");
    if (authMode === "forgot") {
      if (emailFallback) {
        if (!/^\S+@\S+\.\S+$/.test(email)) { setAuthError("Enter your existing account email."); return; }
      } else if (!isValidUsername(username)) { setAuthError("Enter your username (3–30 characters)."); return; }
      setAuthBusy(true);
      try {
        const result = emailFallback ? await requestLegacyPasswordReset(email) : await requestUsernamePasswordReset(username);
        setAuthNotice(result.message);
      } catch {
        setAuthError("Could not request reset instructions. Try again.");
      } finally { setAuthBusy(false); }
      return;
    }
    if (authMode === "signup") {
      if (name.length < 2) { setAuthError("Please enter the learner’s name."); return; }
      if (!isValidUsername(username)) { setAuthError("Choose a username using 3–30 letters, numbers or underscores."); return; }
      if (!/^\S+@\S+\.\S+$/.test(email)) { setAuthError("Enter a valid recovery email address."); return; }
    } else if (emailFallback) {
      if (!/^\S+@\S+\.\S+$/.test(email)) { setAuthError("Enter your existing account email."); return; }
    } else if (!isValidUsername(username)) {
      setAuthError("Enter your username."); return;
    }
    if (authPassword.length < 8) { setAuthError("Password must be at least 8 characters."); return; }
    setAuthBusy(true);
    try {
      if (authMode === "signup") {
        const result = await authClient.signUp.email({ name, email, password: authPassword });
        if (result.error) throw new Error(result.error.message || "Unable to create your account.");
      } else if (emailFallback) {
        const result = await authClient.signIn.email({ email, password: authPassword });
        if (result.error) throw new Error(result.error.message || "Invalid email or password.");
      } else {
        const result = await signInWithUsername(username, authPassword);
        if (!result.ok) throw new Error(result.message);
      }
      const session = await authClient.getSession();
      const user = session.data?.user;
      if (!user) {
        if (authMode === "signup") {
          setAuthMode("signin");
          setEmailFallback(true);
          setAuthPassword("");
          setAuthNotice("Account created. Verify your recovery email if requested, then sign in with your email once to finish username setup.");
          return;
        }
        throw new Error("Could not start your session. Please sign in again.");
      }
      const existing = await getMyUsername();
      if (existing) {
        setAuthUsername(existing);
        setNeedsUsername(false);
      } else if (authMode === "signup") {
        const saved = await claimUsername(username);
        setNeedsUsername(!saved.ok);
        if (!saved.ok) setAuthNotice(saved.message + " Please choose a username below.");
      } else {
        setNeedsUsername(true);
        setAuthNotice("Choose a username for future sign-ins.");
      }
      setSkipUsernameSetup(false);
      setLearnerName(user.name || user.email.split("@")[0]);
      setLearnerEmail(user.email);
      setCloudLoaded(false);
      setAuthPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cloud login is unavailable.";
      setAuthError(message.includes("fetch") || message.includes("Network") ? "Neon login is unavailable right now. Please try again." : message);
    } finally { setAuthBusy(false); }
  };

  const submitUsername = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      const result = await claimUsername(authUsername);
      if (!result.ok) setAuthError(result.message);
      else { setNeedsUsername(false); setAuthUsername(normalizeUsername(authUsername)); setAuthNotice(""); }
    } catch { setAuthError("Unable to save username."); }
    finally { setAuthBusy(false); }
  };

  const logout = async () => {
    await authClient.signOut();
    setLearnerName(null);
    setLearnerEmail("");
    setAuthPassword("");
    setAuthError("");
    setAuthNotice("");
    setNeedsUsername(false);
    setSkipUsernameSetup(false);
    setCloudLoaded(false);
    setHubView(null);
  };

  if (!authReady) return <div className="app-loading"><span className="brand-mark">G</span><p>Preparing your English course…</p></div>;

  if (!learnerName) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-brand"><span className="brand-mark">G</span><div><strong>Grammar Studio</strong><small>Complete English · సంపూర్ణ ఇంగ్లీష్</small></div></div>
          <p className="kicker">Secure cloud learning with Neon</p>
          <h1>{authMode === "signin" ? "Welcome back to your course." : authMode === "signup" ? "Create your learner account." : "Reset your password."}</h1>
          <p className="login-intro">{authMode === "forgot" ? emailFallback ? "Enter your existing account email. We'll send password reset instructions if an account exists." : "Enter your username. We’ll email a reset link to the recovery address on your account." : "Learn English with grammar, conversations, speaking, daily tests, and progress saved with Neon."}</p>
          <p className="login-intro telugu" lang="te">Username తో sign in అవ్వండి. Password మర్చిపోతే మీ recovery email కి link వస్తుంది.</p>
          <form onSubmit={submitAuth}>
            {authMode === "signup" && <label>Learner name<input value={authName} onChange={(event) => setAuthName(event.target.value)} autoComplete="name" required placeholder="Enter learner name" /></label>}
            {((authMode === "signin" && !emailFallback) || authMode === "signup" || (authMode === "forgot" && !emailFallback)) && <label>Username<input value={authUsername} onChange={(event) => setAuthUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30))} autoComplete={authMode === "signin" ? "username" : "off"} minLength={3} maxLength={30} required placeholder="e.g. harikiran_123" /></label>}
            {(authMode === "signup" || (authMode === "signin" && emailFallback) || (authMode === "forgot" && emailFallback)) &&
              <label>{authMode === "signup" ? "Recovery email (for password reset)" : "Existing account email"}<input value={learnerEmail} onChange={(event) => setLearnerEmail(event.target.value)} autoComplete="email" inputMode="email" type="email" required placeholder="name@example.com" /></label>}
            {authMode !== "forgot" && <label>Password<input value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} autoComplete={authMode === "signin" ? "current-password" : "new-password"} type="password" required minLength={8} placeholder="At least 8 characters" /></label>}
            {authError && <p className="auth-error" role="alert">{authError}</p>}
            {authNotice && <p className="auth-notice" role="status">{authNotice}</p>}
            <button type="submit" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "forgot" ? "Send reset link" : authMode === "signin" ? "Sign in & continue" : "Create account & start"}</button>
          </form>
          {authMode === "forgot" && <button type="button" className="auth-mode-switch" onClick={() => { setEmailFallback((current) => !current); setAuthError(""); setAuthNotice(""); }}>{emailFallback ? "Recover using username" : "Old account? Recover using email"}</button>}
          {authMode === "signin" && <div className="auth-assist-row">
            <button type="button" className="auth-mode-switch" onClick={() => { setAuthMode("forgot"); setAuthError(""); setAuthNotice(""); }}>Forgot password?</button>
            <button type="button" className="auth-mode-switch" onClick={() => { setEmailFallback((current) => !current); setAuthError(""); setAuthNotice(""); }}>{emailFallback ? "Sign in using username" : "Existing account? Use email once"}</button>
          </div>}
          <button type="button" className="auth-mode-switch" onClick={() => { setAuthMode((mode) => mode === "signin" ? "signup" : "signin"); setEmailFallback(false); setAuthError(""); setAuthNotice(""); }}>{authMode === "signin" ? "New learner? Create an account" : "Back to username sign in"}</button>
          <div className="local-profile-note"><CheckIcon /><span><strong>Secure sync + offline learning.</strong> Username for login; recovery email is used for password resets. Neon manages passwords and account sessions.</span></div>
        </section>
        <aside className="login-preview" aria-hidden="true"><span>30 days</span><h2>From beginner basics to confident everyday English.</h2><div className="login-skill-list"><b>Listen</b><b>Read</b><b>Write</b><b>Speak</b></div></aside>
      </main>
    );
  }

  if (needsUsername && !skipUsernameSetup) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-brand"><span className="brand-mark">G</span><div><strong>Grammar Studio</strong><small>English · తెలుగు</small></div></div>
          <p className="kicker">One-time account setup</p>
          <h1>Choose your login username.</h1>
          <p className="login-intro">Your existing Neon account and learning progress stay the same. Use this username instead of email next time you sign in.</p>
          <form onSubmit={submitUsername}>
            <label>Username<input value={authUsername} onChange={(event) => setAuthUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30))} minLength={3} maxLength={30} required autoComplete="username" placeholder="e.g. harikiran_123" /></label>
            {authError && <p className="auth-error" role="alert">{authError}</p>}
            <button type="submit" disabled={authBusy}>{authBusy ? "Saving…" : "Save username & continue"}</button>
          </form>
          <button type="button" className="auth-mode-switch" onClick={() => { setSkipUsernameSetup(true); setAuthError(""); }}>Continue with existing account for now</button>
          <button type="button" className="auth-mode-switch" onClick={() => { void logout(); }}>Sign out</button>
        </section>
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
        <button type="button" className="account-button" onClick={() => setHubView("dashboard")} title="Open learner dashboard"><span>{learnerName.charAt(0).toUpperCase()}</span><small>{learnerName}</small><b>{syncStatus === "synced" ? "Cloud synced" : syncStatus === "syncing" ? "Syncing…" : syncStatus === "error" ? "Sync retry" : "Offline saved"}</b></button>
      </header>

      {hubView && (
        <div className="hub-overlay" role="dialog" aria-modal="true" aria-label="Learner progress hub">
          <section className="hub-modal">
            <header className="hub-header"><div><p className="kicker">My learning hub · నా ప్రగతి</p><h2>{learnerName}&apos;s English journey</h2><small>{learnerEmail} · {syncStatus === "synced" ? "Saved securely in Neon" : "Saved offline; cloud will retry"}</small></div><button type="button" onClick={() => setHubView(null)} aria-label="Close dashboard">×</button></header>
            <nav className="hub-tabs" aria-label="Learning hub sections">
              {([ ["dashboard", "Progress"], ["revision", `Review ${reviewItems.length}`], ["test", "Final test"], ["certificate", "Certificate"] ] as [HubView, string][]).map(([view, label]) => <button type="button" key={view} className={hubView === view ? "active" : ""} onClick={() => setHubView(view)}>{label}</button>)}
            </nav>

            {hubView === "dashboard" && <div className="hub-body dashboard-body">
              <div className="metric-grid"><article><span>Course</span><strong>{progress}%</strong><small>{completed.length} of 30 lessons</small></article><article><span>Activities</span><strong>{skillsDone.length}</strong><small>of 120 complete</small></article><article><span>Current streak</span><strong>{streak} 🔥</strong><small>days learning</small></article><article><span>To review</span><strong>{reviewItems.length}</strong><small>personal practice items</small></article></div>
              <section className="badge-section"><h3>Achievements</h3><div className="badge-list">{allBadges.length ? allBadges.map((badge) => <span key={badge}>★ {badge}</span>) : <p>Complete your first lesson to earn a badge.</p>}</div></section>
              <section className="teacher-report"><div><h3>Teacher / parent report</h3><p>Grammar {completed.length}/30 · Skill practice {skillsDone.length}/120 · Writing samples {Object.keys(writings).length} · Revision queue {reviewItems.length}</p><p lang="te">పాఠాలు, practice, writing, mistakes అన్నీ ఒకే చోట చూడవచ్చు.</p></div><button type="button" onClick={() => window.print()}>Print report</button></section>
              <button type="button" className="hub-logout" onClick={() => void logout()}>Sign out of this account</button>
            </div>}

            {hubView === "revision" && <div className="hub-body"><div className="revision-intro"><h3>Smart revision</h3><p>Your difficult questions rise to the top. Review them, then mark them done.</p><p lang="te">మీరు తప్పు చేసిన ప్రశ్నలను మళ్లీ practice చేయండి.</p></div>{reviewItems.length ? <div className="revision-list">{reviewItems.map((item) => <article key={item.id}><span>{item.type} · Day {item.day} · tried {item.attempts}×</span><h4>{item.prompt}</h4><p>Correct answer: <strong>{item.answer}</strong></p><div><button type="button" onClick={() => { setHubView(null); goToLesson(item.day - 1); }}>Open lesson</button><button type="button" onClick={() => setMistakes((items) => items.map((entry) => entry.id === item.id ? { ...entry, reviewed: true } : entry))}>I reviewed this ✓</button></div></article>)}</div> : <div className="empty-hub"><strong>All caught up!</strong><p>No mistakes are waiting for review.</p></div>}</div>}

            {hubView === "test" && <div className="hub-body"><div className="revision-intro"><h3>Final 10-question test</h3><p>Score 80% or higher to unlock your course certificate.</p><p lang="te">Certificate పొందడానికి కనీసం 80% score చేయండి.</p></div><div className="final-test">{testQuestions.map((item, questionIndex) => <fieldset key={item.day}><legend>{questionIndex + 1}. {item.practice.prompt}</legend>{item.practice.options.map((option, optionIndex) => <label key={option}><input type="radio" name={`test-${item.day}`} checked={testAnswers[item.day] === optionIndex} onChange={() => { setTestAnswers((answers) => ({ ...answers, [item.day]: optionIndex })); setTestScore(null); }} />{option}</label>)}</fieldset>)}</div><button type="button" className="submit-test" disabled={Object.keys(testAnswers).length < testQuestions.length} onClick={submitFinalTest}>Check my final test</button>{testScore !== null && <div className={`test-result ${testScore >= 80 ? "pass" : "retry"}`}><strong>{testScore}% — {testScore >= 80 ? "Passed! Certificate unlocked." : "Keep learning and try again."}</strong><p>{testScore >= 80 ? "Excellent work. చాలా బాగా చేశారు!" : "Review your mistakes and aim for 80%."}</p></div>}</div>}

            {hubView === "certificate" && <div className="hub-body"><div className={`certificate ${badges.includes("Final test passed") ? "unlocked" : "locked"}`}><span className="certificate-mark">G</span><p>Certificate of Completion</p><h3>This certifies that</h3><strong>{learnerName}</strong><h4>completed the Grammar Studio English course</h4><p>English grammar · listening · reading · writing · speaking · vocabulary</p><div><span>30-day bilingual learning journey</span><span>{displayDate}</span></div>{!badges.includes("Final test passed") && <aside>Pass the final test with 80% to unlock this certificate.</aside>}</div>{badges.includes("Final test passed") && <button type="button" className="submit-test" onClick={() => window.print()}>Print / Save certificate as PDF</button>}</div>}
          </section>
        </div>
      )}

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
                    {activity.listeningOptions.map((option, index) => <button type="button" key={option} className={listeningAnswer === null ? "" : index === activity.listeningAnswer ? "correct" : listeningAnswer === index ? "wrong" : ""} onClick={() => { setListeningAnswer(index); if (index === activity.listeningAnswer) markSkill("listen"); else rememberMistake("listening", "Where does this conversation happen?", activity.listeningOptions[activity.listeningAnswer]); }}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}
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
                <div className="skill-workspace"><h3>Which reply makes the conversation natural?</h3><p lang="te">Conversation natural గా ఉండే reply ఎంచుకోండి.</p><div className="skill-options">{conversation.options.map((option, index) => <button type="button" key={option.text} className={readingAnswer === null ? "" : index === conversation.best ? "correct" : readingAnswer === index ? "wrong" : ""} onClick={() => { setReadingAnswer(index); if (index === conversation.best) markSkill("read"); else rememberMistake("reading", "Choose the natural reply", conversation.options[conversation.best].text); }}><span>{String.fromCharCode(65 + index)}</span>{option.text}</button>)}</div>{readingAnswer !== null && <p className={`skill-feedback ${readingAnswer === conversation.best ? "success" : "retry"}`}>{readingAnswer === conversation.best ? `Correct. ${conversation.tip}` : `Try again. ${conversation.tip}`}</p>}</div>
              </div>
            )}

            {skillTab === "write" && (
              <div className="skill-panel writing-panel">
                <div className="skill-instruction"><span className="skill-number">03</span><p className="kicker">Write in your own words</p><h3>{lesson.speak}</h3><p lang="te">{lesson.speakTe}</p><div className="writing-tips"><span>Use 5+ words</span><span>Check capital letters</span><span>Finish with punctuation</span></div></div>
                <div className="skill-workspace"><label htmlFor="daily-writing">Your writing</label><textarea id="daily-writing" value={writingText} onChange={(event) => {setWritingText(event.target.value); setWritingSaved(false);}} placeholder="Write your answer in English…" /><div className="writing-coach"><strong>Smart writing coach</strong>{writingWordCount >= 5 ? <ul>{writingFeedback.map((note) => <li key={note}>{note}</li>)}</ul> : <p>Write at least 5 words to receive instant feedback.</p>}</div><div className="writing-footer"><span className={writingWordCount >= 5 ? "ready" : ""}>{writingWordCount} words</span><button type="button" onClick={saveWriting} disabled={writingWordCount < 5}>Save writing</button></div>{writingSaved && <p className="skill-feedback success">Saved offline and synced to your account. మీ writing save అయింది.</p>}</div>
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
                  return <button type="button" key={option} className={`answer-option ${chosen ? "chosen" : ""} ${revealCorrect ? "correct" : ""} ${wrong ? "wrong" : ""}`} onClick={() => { setSelected(index); if (index !== lesson.practice.answer) rememberMistake("grammar", lesson.practice.prompt, lesson.practice.options[lesson.practice.answer]); }}><span>{String.fromCharCode(65 + index)}</span>{option}</button>;
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

          <SpeakingRecorder key={lesson.day} />
          <DailyTestHub key={learnerName} learnerName={learnerName} lesson={lesson} onGoToDay={(day) => {
            const index = lessons.findIndex((item) => item.day === day);
            if (index >= 0) goToLesson(index);
          }} />

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
                      onClick={() => { setConversationChoice(index); if (index !== conversation.best) rememberMistake("conversation", conversation.partner, conversation.options[conversation.best].text); }}
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
                      onKeyDown={(event) => { if (event.key === "Enter" && spellingInput.trim()) checkSpelling(); }}
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="Type what you heard"
                    />
                    <button type="button" onClick={checkSpelling} disabled={!spellingInput.trim()}>Check</button>
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
