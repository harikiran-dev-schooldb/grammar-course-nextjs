"use client";

import { useState } from "react";
import type { PlacementLevel } from "@/lib/progress";

type Skill = {
  key: "grammar" | "listening" | "reading" | "writing" | "speaking" | "vocabulary";
  label: string;
  value: number;
  target: string;
  icon: string;
};

type Props = {
  learnerName: string;
  day: number;
  level: PlacementLevel | null;
  streak: number;
  weeklyMinutes: number;
  dailyMinutes: number;
  dailyGoal: number;
  reviewCount: number;
  completedLessons: number;
  badgesCount: number;
  pronunciationAverage: number;
  skills: Skill[];
  onNavigate: (target: string) => void;
  onOpenWorld: (world: "conversation" | "listening" | "writing" | "speaking") => void;
  onOpenPlacement: () => void;
  onOpenReview: () => void;
  onOpenCertificate: () => void;
  onExportReport: () => void;
};

const levelLabel = (level: PlacementLevel | null) => level === "confident" ? "Confident" : level === "everyday" ? "Everyday" : level === "beginner" ? "Beginner" : "Not checked";

export default function CompleteLearningHub({ learnerName, day, level, streak, weeklyMinutes, dailyMinutes, dailyGoal, reviewCount, completedLessons, badgesCount, pronunciationAverage, skills, onNavigate, onOpenWorld, onOpenPlacement, onOpenReview, onOpenCertificate, onExportReport }: Props) {
  const [view, setView] = useState<"coach" | "worlds" | "parent">("coach");
  const weakest = [...skills].sort((a, b) => a.value - b.value)[0];
  const firstName = learnerName.trim().split(/\s+/)[0] || "Learner";
  const goalPercent = Math.min(100, Math.round((dailyMinutes / Math.max(1, dailyGoal)) * 100));
  const overall = Math.round(skills.reduce((total, skill) => total + skill.value, 0) / skills.length);
  const stage = day <= 10 ? 0 : day <= 20 ? 1 : 2;
  const actions = [
    !level ? { icon: "🧭", label: "Find my starting level", detail: "A quick check makes every next lesson more useful.", action: onOpenPlacement, button: "Take placement" } : null,
    reviewCount ? { icon: "🧠", label: `${reviewCount} smart review${reviewCount === 1 ? "" : "s"} ready`, detail: "Reviewing now helps these words stay in long-term memory.", action: onOpenReview, button: "Review now" } : null,
    { icon: weakest.icon, label: `Strengthen ${weakest.label}`, detail: `This is your best growth area today at ${weakest.value}% mastery.`, action: () => onNavigate(weakest.target), button: "Start practice" },
  ].filter(Boolean).slice(0, 3) as { icon: string; label: string; detail: string; action: () => void; button: string }[];

  return (
    <section className="complete-learning-hub section-block" aria-labelledby="complete-hub-heading">
      <header className="complete-hub-header">
        <div><p className="kicker">Your personal English coach</p><h2 id="complete-hub-heading">One path. Every English skill.</h2><p>Grammar Studio now chooses the most useful next practice from your real progress.</p><p lang="te">మీ progress బట్టి ఇప్పుడు ఏది practice చేయాలో app మీకు చూపిస్తుంది.</p></div>
        <div className="coach-score"><span>Overall mastery</span><strong>{overall}%</strong><i><em style={{ width: `${overall}%` }} /></i></div>
      </header>

      <nav className="complete-hub-tabs" aria-label="Complete learning centre">
        <button type="button" className={view === "coach" ? "active" : ""} onClick={() => setView("coach")}><span>✨</span><b>My Coach</b><small>Adaptive learning path</small></button>
        <button type="button" className={view === "worlds" ? "active" : ""} onClick={() => setView("worlds")}><span>🗺️</span><b>Practice Worlds</b><small>Play with English</small></button>
        <button type="button" className={view === "parent" ? "active" : ""} onClick={() => setView("parent")}><span>📊</span><b>Parent View</b><small>Weekly report</small></button>
      </nav>

      {view === "coach" && <div className="adaptive-coach">
        <div className="coach-greeting"><div><span>Core lesson {day} · {levelLabel(level)} level</span><h3>{firstName}&apos;s best next steps</h3><p>Short, focused practice based on mastery and recent mistakes.</p></div><strong>{streak}<small>day streak 🔥</small></strong></div>
        <div className="adaptive-actions">{actions.map((action, index) => <article key={action.label}><span>{action.icon}</span><div><small>Mission {index + 1}</small><h4>{action.label}</h4><p>{action.detail}</p></div><button type="button" onClick={action.action}>{action.button} →</button></article>)}</div>
        <div className="level-ladder">
          <div><p className="kicker">Basics to advanced</p><h3>Your level journey</h3></div>
          <div>{["Beginner Builder", "Everyday Speaker", "Confident Communicator"].map((name, index) => <article key={name} className={index < stage ? "complete" : index === stage ? "current" : "locked"}><span>{index < stage ? "✓" : index + 1}</span><strong>{name}</strong><small>{index === 0 ? "Sounds, words & simple sentences" : index === 1 ? "Daily listening, writing & conversation" : "Fluent speaking & advanced expression"}</small></article>)}</div>
        </div>
      </div>}

      {view === "worlds" && <div className="practice-worlds">
        <header><p className="kicker">Choose an adventure</p><h3>Learn by doing, not memorising</h3><p lang="te">మీకు నచ్చిన world ఎంచుకొని English ని ఆటలా practice చేయండి.</p></header>
        <div>
          <button type="button" className="conversation-world" onClick={() => onOpenWorld("conversation")}><span>🏙️</span><small>Real-life role-play</small><strong>Conversation Town</strong><p>Practise school, shops, travel and everyday replies.</p><b>Enter town →</b></button>
          <button type="button" className="listening-world" onClick={() => onOpenWorld("listening")}><span>🎧</span><small>Listen and discover</small><strong>Listening Arcade</strong><p>Hear natural dialogues and find the right meaning.</p><b>Start a game →</b></button>
          <button type="button" className="writing-world" onClick={() => onOpenWorld("writing")}><span>✍️</span><small>Create with words</small><strong>Writing Studio</strong><p>Build sentences and receive instant writing guidance.</p><b>Open studio →</b></button>
          <button type="button" className="speaking-world" onClick={() => onOpenWorld("speaking")}><span>🎙️</span><small>Speak with courage</small><strong>Speaking Stage</strong><p>Record, replay and check your pronunciation score.</p><b>Take the stage →</b></button>
        </div>
      </div>}

      {view === "parent" && <div className="parent-dashboard">
        <header><div><p className="kicker">Parent & teacher report</p><h3>{firstName}&apos;s weekly learning snapshot</h3><p>Simple evidence of practice, strengths and where support is needed.</p></div><button type="button" onClick={onExportReport}>Download full report</button></header>
        <div className="parent-metrics">
          <article><span>⏱️</span><strong>{weeklyMinutes}</strong><small>minutes practised</small></article>
          <article><span>🔥</span><strong>{streak}</strong><small>day learning streak</small></article>
          <article><span>✓</span><strong>{completedLessons}/30</strong><small>lessons completed</small></article>
          <article><span>🏅</span><strong>{badgesCount}</strong><small>badges earned</small></article>
        </div>
        <div className="parent-insights">
          <section><div className="parent-section-heading"><h4>Skill growth</h4><span>{overall}% overall</span></div>{skills.map((skill) => <div className="parent-skill" key={skill.key}><span>{skill.label}</span><i><em style={{ width: `${skill.value}%` }} /></i><b>{skill.value}%</b></div>)}</section>
          <aside><span className="insight-icon">💡</span><h4>Teacher insight</h4><p><strong>Focus next:</strong> {weakest.label}. Ten minutes of targeted practice will give the best improvement.</p><p><strong>Speaking:</strong> Average pronunciation score is {pronunciationAverage || 0}%.</p><p lang="te">రోజూ చిన్న practice చేయడం వల్ల confidence వేగంగా పెరుగుతుంది.</p><button type="button" onClick={() => onNavigate(weakest.target)}>Practise {weakest.label}</button></aside>
        </div>
        <div className="parent-footer"><div><strong>Today&apos;s goal</strong><span>{dailyMinutes} of {dailyGoal} minutes</span><i><em style={{ width: `${goalPercent}%` }} /></i></div><button type="button" onClick={onOpenCertificate}>View certificates & milestones →</button></div>
      </div>}
    </section>
  );
}
