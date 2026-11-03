"use client";

import { useState } from "react";
import type { ReadingLevel } from "@/lib/progress";
import { scorePronunciation } from "@/lib/pronunciation";
import { speakText } from "@/lib/speech";

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

const readingStories = [
  {
    id: "sam-cat", badge: "World 1", family: "-at family", title: "Sam the Cat", emoji: "🐱",
    blends: [["c", "at"], ["h", "at"], ["m", "at"]], sightWords: ["is", "a", "has", "on"],
    text: "Sam is a cat. Sam has a hat. Sam sits on a mat.",
    telugu: "Sam ఒక పిల్లి. Sam కి hat ఉంది. Sam mat మీద కూర్చుంటుంది.",
    question: "Where does Sam sit?", questionTe: "Sam ఎక్కడ కూర్చుంటుంది?", options: ["On a mat", "On a hat", "On a bag"], answer: 0,
  },
  {
    id: "ben-hen", badge: "World 2", family: "-en family", title: "Ben and the Hen", emoji: "🐔",
    blends: [["b", "en"], ["h", "en"], ["p", "en"]], sightWords: ["the", "in", "has", "red"],
    text: "Ben has a red hen. The hen is in a pen. Ben feeds the hen.",
    telugu: "Ben కి ఎర్రని hen ఉంది. ఆ hen pen లో ఉంది. Ben దానికి food ఇస్తాడు.",
    question: "Where is the hen?", questionTe: "Hen ఎక్కడ ఉంది?", options: ["In a pen", "On a bus", "In a hat"], answer: 0,
  },
  {
    id: "big-pig", badge: "World 3", family: "-ig family", title: "The Big Pig", emoji: "🐷",
    blends: [["b", "ig"], ["p", "ig"], ["d", "ig"]], sightWords: ["can", "in", "it", "happy"],
    text: "A big pig can dig. The pig digs in the mud. It is a happy pig.",
    telugu: "ఒక పెద్ద pig తవ్వగలదు. అది mud లో తవ్వుతుంది. ఆ pig చాలా happy గా ఉంది.",
    question: "What can the pig do?", questionTe: "Pig ఏమి చేయగలదు?", options: ["It can dig", "It can fly", "It can read"], answer: 0,
  },
] as const;

type SpeechRecognitionResultEvent = { results: { [index: number]: { [index: number]: { transcript: string } } } };
type SpeechRecognitionLike = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null; onend: (() => void) | null;
  start: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function speak(text: string) {
  void speakText(text,{rate:.72});
}

export default function FoundationPlayground({ readingLevel, completedSkills, onChooseLevel, onComplete, onContinueCourse }: Props) {
  const [tab, setTab] = useState<"letters" | "words" | "sentence" | "story">(readingLevel === "word-reader" ? "words" : "letters");
  const [letterIndex, setLetterIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordFeedback, setWordFeedback] = useState<"right" | "wrong" | null>(null);
  const [sentence, setSentence] = useState<string[]>([]);
  const [sentenceFeedback, setSentenceFeedback] = useState<"right" | "wrong" | null>(null);
  const [expanded, setExpanded] = useState(readingLevel !== "sentence-reader");
  const [storyIndex, setStoryIndex] = useState(0);
  const [highlightedWord, setHighlightedWord] = useState(-1);
  const [storyAnswer, setStoryAnswer] = useState<number | null>(null);
  const [readingStatus, setReadingStatus] = useState<"idle" | "listening" | "done" | "unsupported">("idle");
  const [readingScore, setReadingScore] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const foundationDone = completedSkills.filter((key) => key.startsWith("foundation-")).length;
  const activeLetter = letters[letterIndex];
  const activeWord = firstWords[wordIndex];
  const activeStory = readingStories[storyIndex];

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

  const playStory = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeStory.text);
    utterance.lang = "en-IN";
    utterance.rate = .68;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang === "en-IN") || voices.find((voice) => voice.lang.startsWith("en")) || null;
    utterance.onboundary = (event) => {
      const before = activeStory.text.slice(0, event.charIndex).trim();
      setHighlightedWord(before ? before.split(/\s+/).length : 0);
    };
    utterance.onend = () => setHighlightedWord(-1);
    window.speechSynthesis.speak(utterance);
  };

  const startReadingCheck = () => {
    const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setReadingStatus("unsupported"); return; }
    window.speechSynthesis?.cancel();
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    setReadingStatus("listening");
    setReadingScore(null);
    setTranscript("");
    recognition.onresult = (event) => {
      const heard = event.results[0][0].transcript;
      const score = scorePronunciation(activeStory.text, heard);
      setTranscript(heard);
      setReadingScore(score);
      setReadingStatus("done");
      if (score >= 70) onComplete(`foundation-reading-${activeStory.id}`);
    };
    recognition.onerror = () => setReadingStatus("idle");
    recognition.onend = () => setReadingStatus((status) => status === "listening" ? "idle" : status);
    recognition.start();
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
          <button type="button" onClick={() => onChooseLevel("sentence-reader")}><span>Aa</span><strong>I can read sentences</strong><small>Start the Core English Path</small></button>
        </div>
      </section>
    );
  }

  if (readingLevel === "sentence-reader" && !expanded) {
    return (
      <section className="foundation-ready section-block">
        <div><span aria-hidden="true">✓</span><div><strong>Reading foundation ready</strong><small>You can begin the guided Core English Path.</small></div></div>
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
        <button type="button" className={tab === "story" ? "active" : ""} onClick={() => setTab("story")}><span>📖</span><b>Reading Adventure</b></button>
      </nav>

      {tab === "letters" && (
        <div className="letter-game">
          <div className="alphabet-grid" aria-label="English alphabet">
            {letters.map(([letter], index) => <button type="button" key={letter} className={letterIndex === index ? "active" : ""} onClick={() => setLetterIndex(index)}>{completedSkills.includes(`foundation-letter-${letter.toLowerCase()}`) && <i>✓</i>}{letter}</button>)}
          </div>
          <article className="phonics-card">
            <span className="phonics-emoji" aria-hidden="true">{activeLetter[2]}</span>
            <div><span className="phonics-letter">{activeLetter[0]} <small>{activeLetter[0].toLowerCase()}</small></span><h3>{activeLetter[0]} for {activeLetter[1]}</h3><p lang="te">వినండి. తర్వాత మీరే నెమ్మదిగా పలకండి.</p></div>
            <div className="phonics-actions"><button type="button" onClick={() => speak(`${activeLetter[0]} for ${activeLetter[1]}`)}>🔊 Hear it</button><button type="button" onClick={() => onComplete(`foundation-letter-${activeLetter[0].toLowerCase()}`)}>★ I practised</button></div>
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

      {tab === "story" && (
        <div className="reading-adventure">
          <header className="adventure-intro">
            <div><p className="kicker">Read, speak, understand</p><h3>Your Reading Adventure</h3><p>Blend sounds, learn magic words, then read a story aloud.</p><p lang="te">Sounds కలపండి, చిన్న story చదవండి, మీ voice తో practise చేయండి.</p></div>
            <span aria-hidden="true">🏕️</span>
          </header>

          <div className="story-worlds" aria-label="Reading worlds">
            {readingStories.map((story, index) => {
              const locked = index > 0 && !completedSkills.includes(`foundation-story-${readingStories[index - 1].id}`);
              const complete = completedSkills.includes(`foundation-story-${story.id}`);
              return <button type="button" key={story.id} disabled={locked} className={storyIndex === index ? "active" : ""} onClick={() => { setStoryIndex(index); setStoryAnswer(null); setReadingScore(null); setTranscript(""); }}><span>{locked ? "🔒" : story.emoji}</span><small>{story.badge}</small><strong>{story.title}</strong>{complete && <i>★ Complete</i>}</button>;
            })}
          </div>

          <div className="adventure-learning-grid">
            <section className="blend-lab">
              <div className="adventure-section-title"><span>1</span><div><strong>Sound blender</strong><small>{activeStory.family} · tap and listen</small></div></div>
              <div className="blend-buttons">{activeStory.blends.map(([first, ending]) => <button type="button" key={first + ending} onClick={() => speak(`${first}, ${ending}, ${first}${ending}`)}><span>{first}</span><i>+</i><span>{ending}</span><b>{first}{ending}</b><small>🔊</small></button>)}</div>
            </section>
            <section className="sight-word-lab">
              <div className="adventure-section-title"><span>2</span><div><strong>Magic sight words</strong><small>See it, tap it, remember it</small></div></div>
              <div>{activeStory.sightWords.map((word) => <button type="button" key={word} onClick={() => speak(word)}>{word}<small>🔊</small></button>)}</div>
            </section>
          </div>

          <section className="story-reader">
            <div className="adventure-section-title"><span>3</span><div><strong>Read the mini-story</strong><small>Word-by-word highlighting helps your eyes follow</small></div></div>
            <div className="story-book">
              <div className="story-book-art"><span aria-hidden="true">{activeStory.emoji}</span><small>{activeStory.family}</small><strong>{activeStory.title}</strong></div>
              <div className="story-book-page">
                <p className="read-along-text">{activeStory.text.split(/\s+/).map((word, index) => <span key={`${word}-${index}`} className={highlightedWord === index ? "speaking" : ""}>{word} </span>)}</p>
                <p lang="te">{activeStory.telugu}</p>
                <div className="story-audio-actions"><button type="button" onClick={playStory}>🔊 Listen & follow</button><button type="button" className={readingStatus === "listening" ? "listening" : ""} onClick={startReadingCheck}>{readingStatus === "listening" ? "Listening…" : "🎙️ Read it aloud"}</button></div>
                {readingStatus === "unsupported" && <p className="reading-result">Microphone reading works in Chrome or Edge. You can still listen and complete the quiz.</p>}
                {readingScore !== null && <div className={`reading-result ${readingScore >= 70 ? "great" : "try"}`}><strong>{readingScore}% match {readingScore >= 70 ? "★" : ""}</strong><span>{readingScore >= 70 ? "Wonderful reading!" : "Good try—listen once and read again."}</span>{transcript && <small>You said: “{transcript}”</small>}</div>}
              </div>
            </div>
          </section>

          <section className="story-question">
            <div className="adventure-section-title"><span>4</span><div><strong>Story check</strong><small>Show what you understood</small></div></div>
            <h4>{activeStory.question}</h4><p lang="te">{activeStory.questionTe}</p>
            <div>{activeStory.options.map((option, index) => <button type="button" key={option} className={storyAnswer !== null && index === activeStory.answer ? "correct" : storyAnswer === index ? "wrong" : ""} onClick={() => { setStoryAnswer(index); if (index === activeStory.answer) onComplete(`foundation-story-${activeStory.id}`); }}>{option}</button>)}</div>
            {storyAnswer !== null && <p className={storyAnswer === activeStory.answer ? "answer-right" : "answer-wrong"}>{storyAnswer === activeStory.answer ? "Brilliant! Story complete and the next world is unlocked. ★" : "Almost! Look at the story and try once more."}</p>}
          </section>
        </div>
      )}

      <footer className="foundation-footer"><div><strong>Ready for more?</strong><span>You can return to Starter Zone any time.</span></div><button type="button" onClick={onContinueCourse}>Continue to guided course →</button></footer>
    </section>
  );
}
