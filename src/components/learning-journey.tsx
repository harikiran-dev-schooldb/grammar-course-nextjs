"use client";

type JourneyStep = {
  key: string;
  number: string;
  label: string;
  labelTe: string;
  detail: string;
  done: boolean;
  target: string;
};

type Skill = {
  label: string;
  value: number;
  detail: string;
};

type Stage = {
  label: string;
  days: string;
  value: number;
  active: boolean;
};

type Props = {
  learnerName: string;
  day: number;
  level: "beginner" | "everyday" | "confident" | null;
  studyMinutes: number;
  dailyGoalMinutes: number;
  reviewCount: number;
  steps: JourneyStep[];
  skills: Skill[];
  stages: Stage[];
  onOpenPlacement: () => void;
  onOpenReview: () => void;
  onOpenGoals: () => void;
  onNavigate: (target: string) => void;
  onNextLesson: () => void;
};

const levelName = (level: Props["level"]) => level === "confident"
  ? "Confident English"
  : level === "everyday"
    ? "Everyday English"
    : level === "beginner"
      ? "Beginner foundations"
      : "Find your level";

export default function LearningJourney({
  learnerName,
  day,
  level,
  studyMinutes,
  dailyGoalMinutes,
  reviewCount,
  steps,
  skills,
  stages,
  onOpenPlacement,
  onOpenReview,
  onOpenGoals,
  onNavigate,
  onNextLesson,
}: Props) {
  const nextStep = steps.find((step) => !step.done);
  const lessonComplete = !nextStep;
  const firstName = learnerName.trim().split(/\s+/)[0] || "Learner";
  const goalPercent = Math.min(100, Math.round((studyMinutes / dailyGoalMinutes) * 100));

  return (
    <section className="journey-board section-block" aria-labelledby="journey-heading">
      <header className="journey-board-header">
        <div>
          <p className="kicker">Your personalised learning journey</p>
          <h2 id="journey-heading">Good to see you, {firstName}.</h2>
          <p>Follow the lesson mission in order. We&apos;ll guide you from understanding to confident speaking at your pace.</p>
          <p lang="te">Lesson mission ను క్రమంగా పూర్తి చేయండి. మీ pace లో అర్థం చేసుకోవడం నుంచి ధైర్యంగా మాట్లాడటం వరకు మేము guide చేస్తాం.</p>
        </div>
        <button type="button" className="journey-level" onClick={onOpenPlacement}>
          <span>{level ? "Your level" : "Start here"}</span>
          <strong>{levelName(level)}</strong>
          <small>{level ? "Retake placement →" : "Take the 5-minute placement →"}</small>
        </button>
      </header>

      <div className="journey-command-grid">
        <article className="next-action-card">
          <div className="next-action-topline"><span>Next best action</span><b>Core lesson {day}</b></div>
          <div className="next-action-icon" aria-hidden="true">{lessonComplete ? "✓" : nextStep?.number}</div>
          <div>
            <h3>{lessonComplete ? "This lesson mission is complete" : nextStep?.label}</h3>
            <p>{lessonComplete ? "Excellent work. Continue while the ideas are fresh, or review a weak point." : nextStep?.detail}</p>
            {!lessonComplete && <p lang="te">తర్వాత: {nextStep?.labelTe}</p>}
          </div>
          <button type="button" onClick={() => lessonComplete ? onNextLesson() : onNavigate(nextStep!.target)}>
            {lessonComplete ? "Continue to next lesson" : `Continue: ${nextStep?.label}`} <span aria-hidden="true">→</span>
          </button>
        </article>

        <aside className="journey-side-card">
          <div className="journey-goal-heading"><div><span>Today&apos;s study goal</span><strong>{studyMinutes} / {dailyGoalMinutes} min</strong></div><b>{goalPercent}%</b></div>
          <div className="journey-goal-rail" aria-label={`${goalPercent}% of today's goal`}><span style={{ width: `${goalPercent}%` }} /></div>
          <button type="button" onClick={onOpenGoals}>Change goal or reminder</button>
          <div className="journey-review-row">
            <span><b>{reviewCount}</b> items ready to review</span>
            <button type="button" onClick={onOpenReview} disabled={!reviewCount}>{reviewCount ? "Review now" : "All clear"}</button>
          </div>
        </aside>
      </div>

      <div className="mission-flow" aria-label="Current lesson mission">
        {steps.map((step, index) => (
          <button type="button" key={step.key} className={`${step.done ? "done" : ""} ${nextStep?.key === step.key ? "current" : ""}`} onClick={() => onNavigate(step.target)}>
            <span className="mission-step-number">{step.done ? "✓" : step.number}</span>
            <span><strong>{step.label}</strong><small lang="te">{step.labelTe}</small></span>
            {index < steps.length - 1 && <i aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div className="mastery-panel">
        <div className="mastery-heading">
          <div><p className="kicker">End-to-end English</p><h3>Your six-skill mastery</h3></div>
          <span>Every lesson trains every skill</span>
        </div>
        <div className="mastery-grid">
          {skills.map((skill) => (
            <article key={skill.label}>
              <div><strong>{skill.label}</strong><span>{skill.value}%</span></div>
              <i><em style={{ width: `${skill.value}%` }} /></i>
              <small>{skill.detail}</small>
            </article>
          ))}
        </div>
      </div>

      <div className="course-roadmap">
        <div><p className="kicker">Complete learning pathway</p><h3>From first sounds to advanced expression</h3></div>
        <div className="roadmap-stages">
          {stages.map((stage, index) => (
            <article key={stage.label} className={stage.active ? "active" : ""}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{stage.label}</strong><small>{stage.days}</small></div>
              <b>{stage.value}%</b>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
