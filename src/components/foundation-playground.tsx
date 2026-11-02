"use client";

import { useState } from "react";
import type { ReadingLevel } from "@/lib/progress";

type Props = {
  readingLevel: ReadingLevel | null;
  completedSkills: string[];
  onChooseLevel: (level: ReadingLevel) => void;
  onComplete: (key: string) => void;
  onContinueCourse: () => void;
};

const letters = [
  ["A", "apple", "🍎"], ["B", "ball", "⚽"], ["C", "cat", "🐱"], ["D", "dog", "🐶"], ["E", "egg", "🥚"], ["F", "fish", "🐟"],
  ["G", "goat", "🐐"], ["H", "hat", "🎩"], ["I", "ice", "🧊"], ["J", "jug", "🏺"], ["K", "kite", "🪁"], ["L", "lion", "🦁"],
  ["M", "moon", "🌙"], ["N", "nest", "🪺"], ["O", "orange", "🍊"], ["P", "pen", "🖊️"], ["Q", "queen", "👑"], ["R", "rain", "🌧️"],
  ["S", "sun", "☀️"], ["T", "tree", "🌳"], ["U", "umbrella", "☂️"], ["V", "van", "🚐"], ["W", "water", "💧"], ["X", "x-ray", "🩻"],
  ["Y", "yarn", "🧶"], ["Z", "zebra", "🦓"],
] as const;

const firstWords = [
  { word: "cat", emoji: "🐱", options: ["cat", "cup", "car"] },
  { word: "boy", emoji: "👦", options: ["book", "boy", "ball"] },
  { word: "book", emoji: "📘", options: ["bag", "book", "bed"] },
  { word: "school", emoji: "🏫", options: ["shop", "school", "shoe"] },
  { word: "water", emoji: "💧", options: ["window", "water", "woman"] },
  { word: "sun", emoji: "☀️", options: ["sun", "sit", "son"] },
];

const sentenceTarget = ["The", "boy", "reads", "a", "book."];
const sentenceChoices = ["reads", "book.", "The", "a", "boy"];

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = .72;
  utterance.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang === "en-IN") || voices.find((voice) => voice.lang.startsWith("en")) || null;
  window.speechSynthesis.speak(utterance);
}

export default function FoundationPlayground({ readingLevel, completedSkills, onChooseLevel, onComplete, onContinueCourse }: Props) {
  const [tab, setTab] = useState<"letters" | "words" | "sentence">(readingLevel === "word-reader" ? "words" : "letters");
  const [letterIndex, setLetterIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordFeedback, setWordFeedback] = useState<"right" | "wrong" | null>(null);
  const [sentence, setSentence] = useState<string[]>([]);
  const [sentenceFeedback, setSentenceFeedback] = useState<"right" | "wrong" | null>(null);
  const [expanded, setExpanded] = useState(readingLevel !== "sentence-reader");
  const foundationDone = completedSkills.filter((key) => key.startsWith("foundation-")).length;
  const activeLetter = letters[letterIndex];
  const activeWord = firstWords[wordIndex];

  const chooseWord = (answer: string) => {
    const correct = answer === activeWord.word;
    setWordFeedback(correct ? "right" : "wrong");
    if (correct) onComplete(`foundation-word-${activeWord.word}`);
  };

  const checkSentence = () => {
    const correct = sentence.join(" ") === sentenceTarget.join(" ");
    setSentenceFeedback(correct ? "right" : "wrong");
    if (correct) onComplete("foundation-sentence-1");
  };

  if (!readingLevel) {
    return (
      <section className="foundation-entry section-block" aria-labelledby="start-level-heading">
        <div className="foundation-entry-copy">
          <span className="foundation-mascot" aria-hidden="true">✨</span>
          <p className="kicker">Start at the right place</p>
          <h2 id="start-level-heading">How much English can you read?</h2>
          <p>There is no wrong answer. We&apos;ll show the easiest and most helpful starting point.</p>
          <p lang="te">మీకు ఎంత English చదవగలరో ఎంచుకోండి. మీకు సరైన place నుంచి మొదలుపెడతాం.</p>
        </div>
        <div className="reading-level-grid">
          <button type="button" onClick={() => onChooseLevel("pre-reader")}><span>ABC</span><strong>I&apos;m learning letters</strong><small>అక్షరాలు, sounds నుంచి మొదలు</small></button>
          <button type="button" onClick={() => onChooseLevel("word-reader")}><span>CAT</span><strong>I can read small words</strong><small>cat, boy, book లాంటి words</small></button>
          <button type="button" onClick={() => onChooseLevel("sentence-reader")}><span>Aa</span><strong>I can read sentences</strong><small>Start the 30-day English course</small></button>
        </div>
      </section>
    );
  }

  if (readingLevel === "sentence-reader" && !expanded) {
    return (
      <section className="foundation-ready section-block">
        <div><span aria-hidden="true">✓</span><div><strong>Reading foundation ready</strong><small>You can begin the guided 30-day English course.</small></div></div>
        <button type="button" onClick={() => setExpanded(true)}>Open Starter Zone</button>
      </section>
    );
  }

  return (
    <section className="foundation-zone section-block" aria-labelledby="foundation-heading">
      <header className="foundation-header">
        <div><p className="kicker">Starter Zone · ఆటలతో English</p><h2 id="foundation-heading">Learn to read, one small win at a time.</h2><p>Hear it, see it, tap it, and say it. Earn a star for every activity.</p><p lang="te">వినండి, చూడండి, tap చేయండి, పలకండి. ప్రతి activity కి ఒక star పొందండి.</p></div>
        <div className="foundation-stars"><span aria-hidden="true">★</span><strong>{foundationDone}</strong><small>stars earned</small></div>
      </header>

      <nav className="foundation-tabs" aria-label="Starter learning games">
        <button type="button" className={tab === "letters" ? "active" : ""} onClick={() => setTab("letters")}><span>ABC</span><b>Letters & sounds</b></button>
        <button type="button" className={tab === "words" ? "active" : ""} onClick={() => setTab("words")}><span>🐱</span><b>First words</b></button>
        <button type="button" className={tab === "sentence" ? "active" : ""} onClick={() => setTab("sentence")}><span>💬</span><b>Build a sentence</b></button>
      </nav>

      {tab === "letters" && (
        <div className="letter-game">
          <div className="alphabet-grid" aria-label="English alphabet">
            {letters.map(([letter], index) => <button type="button" key={letter} className={letterIndex === index ? "active" : ""} onClick={() => setLetterIndex(index)}>{completedSkills.includes(`foundation-letter-${letter.toLowerCase()}`) && <i>✓</i>}{letter}</button>)}
          </div>
          <article className="phonics-card">
            <span className="phonics-emoji" aria-hidden="true">{activeLetter[2]}</span>
            <div><span className="phonics-letter">{activeLetter[0]} <small>{activeLetter[0].toLowerCase()}</small></span><h3>{activeLetter[0]} is for {activeLetter[1]}</h3><p lang="te">వినండి. తర్వాత మీరే నెమ్మదిగా పలకండి.</p></div>
            <div className="phonics-actions"><button type="button" onClick={() => speak(`${activeLetter[0]}. ${activeLetter[0]} is for ${activeLetter[1]}.`)}>🔊 Hear it</button><button type="button" onClick={() => onComplete(`foundation-letter-${activeLetter[0].toLowerCase()}`)}>★ I practised</button></div>
          </article>
        </div>
      )}

      {tab === "words" && (
        <div className="first-word-game">
          <div className="game-progress"><span>Word {wordIndex + 1} of {firstWords.length}</span><i><em style={{ width: `${((wordIndex + 1) / firstWords.length) * 100}%` }} /></i></div>
          <div className="picture-word-card"><span aria-hidden="true">{activeWord.emoji}</span><h3>Which word matches the picture?</h3><p lang="te">Picture కి సరైన word ఎంచుకోండి.</p><button type="button" className="hear-word" onClick={() => speak(activeWord.word)}>🔊 Hear the word</button></div>
          <div className="word-choice-grid">{activeWord.options.map((option) => <button type="button" key={option} className={wordFeedback && option === activeWord.word ? "correct" : ""} onClick={() => chooseWord(option)}>{option}</button>)}</div>
          {wordFeedback && <div className={`foundation-feedback ${wordFeedback}`}><strong>{wordFeedback === "right" ? "Great job! You earned a star. ★" : "Good try. Listen once more."}</strong><span lang="te">{wordFeedback === "right" ? "చాలా బాగుంది!" : "మరొక్కసారి వినండి."}</span></div>}
          <button type="button" className="next-foundation-game" onClick={() => { setWordIndex((wordIndex + 1) % firstWords.length); setWordFeedback(null); }}>Next word →</button>
        </div>
      )}

      {tab === "sentence" && (
        <div className="sentence-game">
          <div className="sentence-example"><span aria-hidden="true">👦📘</span><div><p className="kicker">Make this sentence</p><h3>The boy reads a book.</h3><button type="button" onClick={() => speak("The boy reads a book.")}>🔊 Hear sentence</button></div></div>
          <div className="sentence-builder" aria-label="Your sentence">{sentence.length ? sentence.map((word, index) => <button type="button" key={`${word}-${index}`} onClick={() => { setSentence((words) => words.filter((_, itemIndex) => itemIndex !== index)); setSentenceFeedback(null); }}>{word}</button>) : <span>Tap the words below in the correct order.</span>}</div>
          <div className="sentence-word-bank">{sentenceChoices.map((word) => <button type="button" key={word} disabled={sentence.includes(word)} onClick={() => { setSentence((words) => [...words, word]); setSentenceFeedback(null); }}>{word}</button>)}</div>
          <div className="sentence-actions"><button type="button" onClick={() => { setSentence([]); setSentenceFeedback(null); }}>Start again</button><button type="button" onClick={checkSentence} disabled={sentence.length !== sentenceTarget.length}>Check sentence</button></div>
          {sentenceFeedback && <div className={`foundation-feedback ${sentenceFeedback}`}><strong>{sentenceFeedback === "right" ? "Perfect sentence! ★" : "Almost—check the word order."}</strong><span lang="te">{sentenceFeedback === "right" ? "Sentence సరిగ్గా చేశారు!" : "Words order మరొక్కసారి చూడండి."}</span></div>}
        </div>
      )}

      <footer className="foundation-footer"><div><strong>Ready for more?</strong><span>You can return to Starter Zone any time.</span></div><button type="button" onClick={onContinueCourse}>Continue to guided course →</button></footer>
    </section>
  );
}
