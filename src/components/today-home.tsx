"use client";

type Props = {
  learnerName: string;
  day: number;
  lessonTitle: string;
  lessonTitleTe: string;
  nextLabel: string;
  nextDetail: string;
  progress: number;
  streak: number;
  minutes: number;
  goal: number;
  reviewCount: number;
  speakingDone: boolean;
  onContinue: () => void;
  onReview: () => void;
  onSpeaking: () => void;
  onProgress: () => void;
  onLessons: () => void;
  onPhonics: () => void;
  onReadingCoach: () => void;
};

export default function TodayHome({ learnerName, day, lessonTitle, lessonTitleTe, nextLabel, nextDetail, progress, streak, minutes, goal, reviewCount, speakingDone, onContinue, onReview, onSpeaking, onProgress, onLessons, onPhonics, onReadingCoach }: Props) {
  const firstName = learnerName.trim().split(/\s+/)[0] || "Learner";
  const goalPercent = Math.min(100, Math.round((minutes / Math.max(1, goal)) * 100));
  return <section className="today-home" aria-labelledby="today-home-heading">
    <header className="today-welcome">
      <div><p className="kicker">Today · ఈ రోజు</p><h1 id="today-home-heading">Ready for a small win, {firstName}?</h1><p>Your next activity is already chosen. Just continue—no searching needed.</p><p lang="te">తర్వాత ఏమి చేయాలో సిద్ధంగా ఉంది. Continue నొక్కి నేర్చుకోవడం మొదలుపెట్టండి.</p></div>
      <div className="today-streak"><span>🔥</span><strong>{streak}</strong><small>day streak</small></div>
    </header>

    <div className="today-primary-grid">
      <article className="continue-card">
        <div className="continue-topline"><span>Continue learning</span><b>Day {day} of 30</b></div>
        <p className="kicker">{nextLabel} is next</p><h2>{lessonTitle}</h2><p lang="te">{lessonTitleTe}</p><p>{nextDetail}</p>
        <div className="continue-progress"><span><b>{progress}%</b> course complete</span><i><em style={{width:`${progress}%`}} /></i></div>
        <button type="button" onClick={onContinue}>Continue: {nextLabel} <span>→</span></button>
      </article>
      <aside className="today-goal-card"><div><span>Today&apos;s goal</span><strong>{minutes}<small> / {goal} min</small></strong></div><div className="goal-ring" style={{"--goal":`${goalPercent * 3.6}deg`} as React.CSSProperties}><span>{goalPercent}%</span></div><p>{goalPercent >= 100 ? "Goal complete—excellent consistency!" : `${Math.max(0, goal-minutes)} minutes left for today's goal.`}</p><button type="button" onClick={onProgress}>View my progress</button></aside>
    </div>

    <div className="today-actions">
      <button type="button" onClick={onSpeaking}><span>🎙️</span><small>Daily challenge</small><strong>{speakingDone ? "Speaking mission complete ✓" : "Start speaking mission"}</strong><p>Answer aloud and receive bilingual coaching.</p><b>{speakingDone ? "Practise again" : "Start mission"} →</b></button>
      <button type="button" onClick={onReview}><span>🧠</span><small>Memory practice</small><strong>{reviewCount ? `${reviewCount} reviews are ready` : "Revision is clear"}</strong><p>Weak words return at the right time.</p><b>{reviewCount ? "Review now" : "See revision"} →</b></button>
      <button type="button" onClick={onLessons}><span>🗺️</span><small>Explore course</small><strong>All 30 lessons</strong><p>Move from foundations to confident English.</p><b>Open course map →</b></button>
      <button type="button" className="phonics-action" onClick={onPhonics}><span>🔤</span><small>Learn to read</small><strong>Phonics Academy</strong><p>Sounds, blending, digraphs and fluent reading.</p><b>Start phonics →</b></button>
    </div>

    <button type="button" className="reading-coach-entry" onClick={onReadingCoach}><span>📖</span><div><small>NEW · PERSONAL READING COACH</small><strong>Read aloud and improve every word</strong><p>Get instant accuracy, reading speed and bilingual feedback.</p><p lang="te">చదివి, ప్రతి word కి వెంటనే feedback పొందండి.</p></div><b>Start reading →</b></button>

    <footer className="today-home-footer"><span>Recommended order</span><div><b>1</b> Learn <i>→</i><b>2</b> Practise <i>→</i><b>3</b> Speak <i>→</i><b>4</b> Talk <i>→</i><b>5</b> Words <i>→</i><b>6</b> Test <i>→</i><b>7</b> Finish</div></footer>
  </section>;
}
