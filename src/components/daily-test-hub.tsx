"use client";

import { useEffect, useMemo, useState } from "react";
import { type Lesson, lessons } from "../data/lessons";
import { getDailyTestQuestions, getQuestionsForDay } from "../data/daily-test-questions";
import {
  type DailyTestRecord, type DailyTestRecords, type TestQuestion,
  PASS_PERCENT, percent, parseDailyTestRecords, createTestRecord,
  getRevisionQuestions, clearRevisedMistakes, mergeDailyTestRecords,
} from "../lib/daily-test-core";

type Props = {
  learnerName: string;
  lesson: Lesson;
  savedRecords: DailyTestRecords;
  onRecordsChange: (records: DailyTestRecords) => void;
  onGoToDay: (day: number) => void;
};

function storageKey(name: string): string {
  return "grammar-studio-daily-tests-" + name.trim().toLocaleLowerCase("en");
}

function DailyQuiz({
  lesson, previous, onSave,
}: {
  lesson: Lesson;
  previous?: DailyTestRecord;
  onSave: (questions: TestQuestion[], answers: (number | null)[]) => DailyTestRecord;
}) {
  const questions = useMemo(() => getDailyTestQuestions(lesson), [lesson]);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [report, setReport] = useState<DailyTestRecord | null>(null);
  const [error, setError] = useState("");
  const complete = answers.length === questions.length && answers.every((answer) => answer !== null);

  const submit = () => {
    if (!complete || report) return;
    try {
      setReport(onSave(questions, answers));
      setError("");
    } catch {
      setError("Could not score the test. Please answer every question and try again.");
    }
  };

  const retry = () => {
    setAnswers(questions.map(() => null));
    setReport(null);
    setError("");
  };

  return (
    <div className="daily-quiz" aria-labelledby="daily-quiz-title">
      <div className="daily-quiz-heading">
        <div>
          <p className="kicker">Core lesson {lesson.day} assessment</p>
          <h3 id="daily-quiz-title">{lesson.title} — Lesson Checkpoint</h3>
          <p lang="te">{lesson.titleTe} · ప్రతి ప్రశ్నకు సమాధానం ఇవ్వండి.</p>
        </div>
        <span className="daily-test-pass-label">Pass: {PASS_PERCENT}%</span>
      </div>
      <p className="daily-quiz-intro">Five questions: three grammar checks and two English–Telugu comprehension checks. You may retake the test to improve your score.</p>
      {previous && !report && (
        <p className="daily-quiz-prev">Previous best: {percent(previous.bestScore, previous.totalQuestions)}% · Attempts: {previous.attempts}</p>
      )}
      {questions.map((question, index) => (
        <fieldset className="daily-quiz-question" key={question.id} disabled={report !== null}>
          <legend><span className="daily-question-number">{index + 1} / {questions.length}</span> {question.prompt}</legend>
          <p lang="te">{question.promptTe}</p>
          <div className="daily-quiz-options">
            {question.options.map((option, optionIndex) => {
              const correct = report && optionIndex === question.answer;
              const wrong = report && answers[index] === optionIndex && !correct;
              return (
                <label className={"daily-quiz-option" + (correct ? " is-correct" : "") + (wrong ? " is-wrong" : "")} key={optionIndex}>
                  <input
                    type="radio"
                    name={"test-day-" + lesson.day + "-question-" + index}
                    checked={answers[index] === optionIndex}
                    onChange={() => {
                      setAnswers((prev) => prev.map((value, i) => i === index ? optionIndex : value));
                    }}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
          {report && (
            <div className={"daily-answer-feedback" + (answers[index] === question.answer ? " is-right" : " is-wrong")} role="status">
              <strong>{answers[index] === question.answer ? "Correct ✓" : "Review this answer"}</strong>
              <p>{question.explanation}</p>
              <p lang="te">{question.explanationTe}</p>
            </div>
          )}
        </fieldset>
      ))}
      {error && <p className="daily-test-error" role="alert">{error}</p>}
      {report ? (
        <div className="daily-test-result" aria-live="polite">
          <div>
            <strong className="daily-test-big-score">{percent(report.latestScore, report.totalQuestions)}%</strong>
            <p>{report.latestScore} of {report.totalQuestions} correct · {percent(report.latestScore, report.totalQuestions) >= PASS_PERCENT ? "Passed this attempt!" : "Keep practising and try again."}</p>
            <p lang="te">{percent(report.latestScore, report.totalQuestions) >= PASS_PERCENT ? "బాగా చేశారు! మీరు పాస్ అయ్యారు." : "తప్పులు చూసి మళ్లీ practice చేయండి."}</p>
          </div>
          <button type="button" className="daily-test-primary" onClick={retry}>Retake test</button>
        </div>
      ) : (
        <div className="daily-test-submit-row">
          <span>{answers.filter((answer) => answer !== null).length} / {questions.length} answered</span>
          <button type="button" className="daily-test-primary" disabled={!complete || !questions.length} onClick={submit}>Submit lesson checkpoint</button>
        </div>
      )}
    </div>
  );
}

export default function DailyTestHub({ lesson, learnerName, savedRecords, onRecordsChange, onGoToDay }: Props) {
  const [records, setRecords] = useState<DailyTestRecords>({});
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [revisionItems, setRevisionItems] = useState<TestQuestion[]>([]);
  const [revisionIndex, setRevisionIndex] = useState(0);
  const [revisionChoice, setRevisionChoice] = useState<number | null>(null);
  const [revisionChecked, setRevisionChecked] = useState(false);
  const [correctlyRevised, setCorrectlyRevised] = useState<string[]>([]);
  const [revisionSummary, setRevisionSummary] = useState<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const deviceRecords = parseDailyTestRecords(
          window.localStorage.getItem(storageKey(learnerName)),
          lessons.map((item) => item.day),
        );
        setRecords(deviceRecords);
        onRecordsChange(deviceRecords);
      } catch {
        setStorageError(true);
      }
      setLoaded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [learnerName, onRecordsChange]);

  useEffect(() => {
    if (!loaded) return;
    const frame = window.requestAnimationFrame(() => {
      const merged = mergeDailyTestRecords(records, savedRecords);
      const mergedJson = JSON.stringify(merged);
      if (mergedJson !== JSON.stringify(records)) setRecords(merged);
      if (mergedJson !== JSON.stringify(savedRecords)) onRecordsChange(merged);
      try {
        window.localStorage.setItem(storageKey(learnerName), mergedJson);
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [learnerName, loaded, onRecordsChange, records, savedRecords]);

  const saveRecords = (next: DailyTestRecords) => {
    setRecords(next);
    onRecordsChange(next);
    try {
      window.localStorage.setItem(storageKey(learnerName), JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  };

  const saveAttempt = (questions: TestQuestion[], answers: (number | null)[]): DailyTestRecord => {
    const result = createTestRecord(records[lesson.day], lesson.day, questions, answers, Date.now());
    saveRecords({ ...records, [lesson.day]: result });
    return result;
  };

  const allResults = useMemo(() => Object.values(records).sort((a, b) => a.day - b.day), [records]);
  const passed = allResults.filter((result) => percent(result.bestScore, result.totalQuestions) >= PASS_PERCENT).length;
  const average = allResults.length
    ? Math.round(allResults.reduce((sum, result) => sum + percent(result.bestScore, result.totalQuestions), 0) / allResults.length)
    : 0;
  const needsWork = allResults
    .filter((result) => result.incorrectIds.length > 0 || percent(result.bestScore, result.totalQuestions) < PASS_PERCENT)
    .sort((a, b) => b.incorrectIds.length - a.incorrectIds.length || a.day - b.day);
  const revisionPool = useMemo(() => getRevisionQuestions(records, getQuestionsForDay, 10), [records]);
  const reviewing = revisionItems.length > 0;
  const currentRevision = reviewing ? revisionItems[revisionIndex] : null;

  const startRevision = () => {
    if (!revisionPool.length) return;
    setRevisionItems(revisionPool);
    setRevisionIndex(0);
    setRevisionChoice(null);
    setRevisionChecked(false);
    setCorrectlyRevised([]);
    setRevisionSummary(null);
  };

  const nextRevision = () => {
    if (!currentRevision || !revisionChecked) return;
    const correct = revisionChoice === currentRevision.answer;
    const updatedCorrect = correct ? [...correctlyRevised, currentRevision.id] : correctlyRevised;
    if (revisionIndex === revisionItems.length - 1) {
      if (updatedCorrect.length) saveRecords(clearRevisedMistakes(records, updatedCorrect));
      setRevisionSummary(updatedCorrect.length + " of " + revisionItems.length + " mistakes corrected. Incorrect answers remain in your revision queue.");
      setRevisionItems([]);
      setCorrectlyRevised([]);
    } else {
      setCorrectlyRevised(updatedCorrect);
      setRevisionIndex((index) => index + 1);
    }
    setRevisionChoice(null);
    setRevisionChecked(false);
  };

  return (
    <section className="daily-test-hub section-block" id="daily-tests" aria-label="Lesson checkpoints and personalised revision">
      <header className="daily-test-header">
        <div><p className="kicker">Learn • Check • Revise</p><h2>Lesson Checkpoints & Smart Revision</h2><p lang="te">ప్రతి lesson తర్వాత checkpoint పూర్తి చేసి, mistakes ని మళ్లీ practice చేయండి.</p></div>
        <span className="daily-test-offline-tag">Works offline</span>
      </header>
      {!loaded ? <p>Loading saved test scores…</p> : (
        <>
          <div className="daily-test-stat-grid" aria-label="Learning dashboard">
            <div><strong>{allResults.length} / {lessons.length}</strong><span>Lessons checked</span></div>
            <div><strong>{passed}</strong><span>Checkpoints passed</span></div>
            <div><strong>{average}%</strong><span>Average best score</span></div>
            <div><strong>{Object.values(records).reduce((sum, item) => sum + item.incorrectIds.length, 0)}</strong><span>Mistakes to revise</span></div>
          </div>

          <div className="daily-revision-card">
            <div className="daily-revision-heading">
              <div><h3>Personalized revision</h3><p>Questions you missed most recently are collected here. Correct a mistake to clear it from your practice queue.</p></div>
              {!reviewing && <button className="daily-test-primary" type="button" onClick={startRevision} disabled={!revisionPool.length}>Practice mistakes ({revisionPool.length})</button>}
            </div>
            {needsWork.length > 0 ? (
              <div className="daily-weak-topic-list">
                {needsWork.slice(0, 6).map((item) => {
                  const day = lessons.find((entry) => entry.day === item.day);
                  return (
                    <button type="button" key={item.day} onClick={() => onGoToDay(item.day)}>
                      <span>Lesson {item.day}: {day?.title ?? "Grammar review"}</span>
                      <strong>{percent(item.bestScore, item.totalQuestions)}% best · {item.incorrectIds.length} to revise</strong>
                    </button>
                  );
                })}
              </div>
            ) : <p className="daily-revision-empty">No weak topics yet. Complete a lesson checkpoint to see personalised suggestions.</p>}

            {currentRevision && (
              <div className="daily-revision-session" aria-live="polite">
                <div className="daily-revision-session-top"><span>Revision {revisionIndex + 1} / {revisionItems.length}</span><span>From lesson {currentRevision.day}</span></div>
                <h4>{currentRevision.prompt}</h4>
                <p lang="te">{currentRevision.promptTe}</p>
                <fieldset disabled={revisionChecked}>
                  <legend className="sr-only">Choose an answer</legend>
                  {currentRevision.options.map((option, index) => (
                    <label key={index} className="daily-quiz-option">
                      <input type="radio" name="revision-answer" checked={revisionChoice === index} onChange={() => setRevisionChoice(index)} />
                      <span>{option}</span>
                    </label>
                  ))}
                </fieldset>
                {revisionChecked && (
                  <div className={"daily-answer-feedback" + (revisionChoice === currentRevision.answer ? " is-right" : " is-wrong")}>
                    <strong>{revisionChoice === currentRevision.answer ? "Correct! Great revision." : "Not quite. Remember this rule."}</strong>
                    <p>{currentRevision.explanation}</p>
                    <p lang="te">{currentRevision.explanationTe}</p>
                  </div>
                )}
                <div className="daily-test-submit-row">
                  {!revisionChecked ? (
                    <button className="daily-test-primary" type="button" disabled={revisionChoice === null} onClick={() => setRevisionChecked(true)}>Check answer</button>
                  ) : <button className="daily-test-primary" type="button" onClick={nextRevision}>{revisionIndex === revisionItems.length - 1 ? "Finish revision" : "Next mistake"}</button>}
                  <button type="button" className="daily-test-text-button" onClick={() => { setRevisionItems([]); setRevisionSummary(null); }}>Exit revision</button>
                </div>
              </div>
            )}
            {revisionSummary && <p className="daily-revision-summary" role="status">{revisionSummary}</p>}
          </div>

          <DailyQuiz key={lesson.day} lesson={lesson} previous={records[lesson.day]} onSave={saveAttempt} />

          <details className="daily-score-history">
            <summary>View scores for all core lessons</summary>
            <div className="daily-score-grid">
              {lessons.map((item) => {
                const result = records[item.day];
                const passedDay = result && percent(result.bestScore, result.totalQuestions) >= PASS_PERCENT;
                return (
                  <button type="button" key={item.day} className={passedDay ? "passed" : ""} onClick={() => onGoToDay(item.day)}>
                    <strong>Lesson {item.day}</strong>
                    <span>{result ? percent(result.bestScore, result.totalQuestions) + "% best" : "Not taken"}</span>
                  </button>
                );
              })}
            </div>
          </details>

          {storageError && <p className="daily-test-error" role="alert">Your browser is blocking local storage. Scores will work temporarily but may not survive a refresh.</p>}
          <p className="daily-test-privacy">Checkpoint scores and revision history are saved on this device and synced to your Neon account. Passing requires at least {PASS_PERCENT}% (4 of 5 correct). Finishing a lesson and passing its checkpoint are tracked separately.</p>
        </>
      )}
    </section>
  );
}
