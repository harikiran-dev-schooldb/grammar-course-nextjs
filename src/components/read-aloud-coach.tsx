"use client";

import { useMemo, useRef, useState } from "react";
import { analyzeReading, type ReadingAnalysis } from "@/lib/pronunciation";
import type { ReadingCoachResult } from "@/lib/progress";
import { readingPassages } from "@/data/reading-passages";
import { speakText } from "@/lib/speech";

type RecognitionEvent = { results: { length: number; [index: number]: { [index: number]: { transcript: string } } } };
type Recognition = { lang:string; interimResults:boolean; continuous:boolean; onresult:((event:RecognitionEvent)=>void)|null; onerror:(()=>void)|null; onend:(()=>void)|null; start:()=>void; stop:()=>void };
type RecognitionConstructor = new()=>Recognition;
type Props = { results: ReadingCoachResult[]; onResult: (result: ReadingCoachResult) => void; onComplete: (key: string) => void; onBack: () => void };

function speak(text:string, rate=.8){void speakText(text,{rate})}

export default function ReadAloudCoach({ results, onResult, onComplete, onBack }: Props) {
  const recommended = Math.max(0, readingPassages.findIndex((passage) => !results.some((result) => result.passageId === passage.id && result.accuracy >= 80)));
  const [passageIndex,setPassageIndex]=useState(recommended);
  const [status,setStatus]=useState<"idle"|"listening"|"unsupported"|"error">("idle");
  const [transcript,setTranscript]=useState("");
  const [analysis,setAnalysis]=useState<ReadingAnalysis|null>(null);
  const [wordsPerMinute,setWordsPerMinute]=useState(0);
  const startedAt=useRef(0);
  const recognitionRef=useRef<Recognition|null>(null);
  const passage=readingPassages[passageIndex];
  const saved=results.find((result)=>result.passageId===passage.id);
  const completed=results.filter((result)=>result.accuracy>=80).length;
  const average=results.length?Math.round(results.reduce((total,result)=>total+result.accuracy,0)/results.length):0;
  const bestWpm=results.length?Math.max(...results.map((result)=>result.wordsPerMinute)):0;
  const weakWords=useMemo(()=>[...new Set(results.flatMap((result)=>result.missedWords))].slice(-8),[results]);

  const selectPassage=(index:number)=>{setPassageIndex(index);setTranscript("");setAnalysis(null);setWordsPerMinute(0);setStatus("idle");window.scrollTo({top:0,behavior:"smooth"});};
  const stop=()=>{recognitionRef.current?.stop();setStatus("idle")};
  const listen=()=>{
    const speechWindow=window as typeof window&{SpeechRecognition?:RecognitionConstructor;webkitSpeechRecognition?:RecognitionConstructor};
    const Constructor=speechWindow.SpeechRecognition||speechWindow.webkitSpeechRecognition;
    if(!Constructor){setStatus("unsupported");return;}
    window.speechSynthesis?.cancel();
    const recognition=new Constructor();recognitionRef.current=recognition;recognition.lang="en-IN";recognition.interimResults=false;recognition.continuous=false;startedAt.current=Date.now();setStatus("listening");setTranscript("");setAnalysis(null);setWordsPerMinute(0);
    recognition.onresult=(event)=>{const heard=Array.from({length:event.results.length},(_,index)=>event.results[index][0].transcript).join(" ").trim();const reading=analyzeReading(passage.text,heard);const seconds=Math.max(5,(Date.now()-startedAt.current)/1000);const wpm=Math.min(300,Math.round((heard.split(/\s+/).filter(Boolean).length/seconds)*60));const result:ReadingCoachResult={passageId:passage.id,accuracy:reading.accuracy,wordsPerMinute:wpm,missedWords:reading.missed,transcript:heard,updatedAt:new Date().toISOString()};setTranscript(heard);setAnalysis(reading);setWordsPerMinute(wpm);setStatus("idle");onResult(result);if(reading.accuracy>=80)onComplete(`reading-coach-${passage.id}`);};
    recognition.onerror=()=>{setStatus("error")};recognition.onend=()=>setStatus((value)=>value==="listening"?"idle":value);recognition.start();
  };

  return <section className="read-coach" aria-labelledby="read-coach-title">
    <header className="read-coach-hero"><button type="button" onClick={onBack}>← Learning home</button><div><p className="kicker">AI Read-Aloud Coach · చదివే సాధన</p><h1 id="read-coach-title">Read. Listen. Improve.</h1><p>Your coach follows every word and shows exactly what to practise next.</p><p lang="te">మీరు చదివే ప్రతి word ని check చేసి, తర్వాత ఏది practice చేయాలో చూపిస్తుంది.</p></div><div className="read-coach-score"><strong>{completed}</strong><small>/ {readingPassages.length}<br/>passages mastered</small></div></header>

    <section className="reading-report"><div><small>Reading level</small><strong>{results.length?readingPassages[Math.min(readingPassages.length-1,Math.max(0,completed))].level:"START"}</strong></div><div><small>Average accuracy</small><strong>{average}%</strong></div><div><small>Best reading speed</small><strong>{bestWpm}<i> wpm</i></strong></div><div><small>Words to practise</small><strong>{weakWords.length}</strong></div></section>

    <div className="read-coach-layout">
      <nav className="passage-list" aria-label="Reading passages">{readingPassages.map((item,index)=>{const result=results.find((entry)=>entry.passageId===item.id);return <button type="button" key={item.id} className={index===passageIndex?"active":""} onClick={()=>selectPassage(index)}><span>{result?.accuracy&&result.accuracy>=80?"✓":index+1}</span><div><small>{item.level}{result?` · ${result.accuracy}%`:""}</small><b>{item.title}</b><i lang="te">{item.titleTe}</i></div></button>})}</nav>

      <main className="reading-studio">
        <header><div><p className="kicker">{passage.level} · Passage {passageIndex+1} of {readingPassages.length}</p><h2>{passage.title}</h2><p lang="te">{passage.titleTe}</p></div><button type="button" onClick={()=>speak(passage.text,.76)}>🔊 Listen first</button></header>
        <div className="coach-tip"><span>💡</span><div><b>Coach tip</b><p>{passage.tip}</p><p lang="te">{passage.tipTe}</p></div></div>

        <section className="reading-card" aria-label="Passage to read"><small>Read this aloud</small><p>{analysis?analysis.words.map((item,index)=><span key={`${item.word}-${index}`} className={item.status}>{item.word}</span>):passage.text}</p><div className="reading-legend"><span><i className="correct"/>Correct</span><span><i className="close"/>Try again</span><span><i className="missed"/>Missed</span></div></section>

        <div className="read-controls"><button type="button" className={status==="listening"?"listening":""} onClick={status==="listening"?stop:listen}><span>{status==="listening"?"■":"🎙️"}</span><b>{status==="listening"?"Stop and check":"Start reading aloud"}</b><small>{status==="listening"?"We are listening to every word…":"Allow microphone, then read the passage"}</small></button><button type="button" onClick={()=>speak(passage.text,.65)}>🐢 Hear slowly</button></div>
        {status==="unsupported"&&<div className="reading-notice">Voice checking needs Chrome or Edge. You can still listen and read aloud for practice.<br/><span lang="te">Voice checking కోసం Chrome లేదా Edge వాడండి.</span></div>}
        {status==="error"&&<div className="reading-notice error">Microphone could not start. Check browser microphone permission and try again.</div>}

        {analysis&&<section className="reading-feedback" aria-live="polite"><header><div className={`accuracy-ring ${analysis.accuracy>=80?"good":analysis.accuracy>=60?"close":"retry"}`}><strong>{analysis.accuracy}%</strong><small>accuracy</small></div><div><p className="kicker">Your reading result</p><h3>{analysis.accuracy>=90?"Excellent, clear reading!":analysis.accuracy>=80?"Good reading—passage mastered!":analysis.accuracy>=60?"Good effort—practise the marked words.":"Keep going—read slowly and try again."}</h3><p lang="te">{analysis.accuracy>=80?"చాలా బాగా చదివారు. Next passage కి వెళ్లవచ్చు.":"Mark చేసిన words విని, నెమ్మదిగా మళ్లీ చదవండి."}</p></div></header><div className="reading-metrics"><span><strong>{analysis.correct}</strong><small>correct words</small></span><span><strong>{analysis.close}</strong><small>nearly right</small></span><span><strong>{analysis.missed.length}</strong><small>to practise</small></span><span><strong>{wordsPerMinute}</strong><small>words/min</small></span></div><div className="heard-transcript"><small>We heard</small><p>“{transcript}”</p></div>{analysis.missed.length>0&&<div className="weak-word-practice"><small>Tap and repeat these words</small><div>{[...new Set(analysis.missed)].map((word)=><button type="button" key={word} onClick={()=>speak(word,.65)}>🔊 {word}</button>)}</div></div>}<footer><button type="button" onClick={()=>{setAnalysis(null);setTranscript("");setStatus("idle")}}>Try this passage again</button><button type="button" disabled={analysis.accuracy<80} onClick={()=>selectPassage(Math.min(readingPassages.length-1,passageIndex+1))}>Next passage →</button></footer></section>}
        {!analysis&&saved&&<div className="previous-reading"><span>Previous best on this passage</span><strong>{saved.accuracy}% accuracy · {saved.wordsPerMinute} wpm</strong></div>}
      </main>
    </div>
  </section>;
}
