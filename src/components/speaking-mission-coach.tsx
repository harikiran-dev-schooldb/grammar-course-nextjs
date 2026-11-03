"use client";

import { useState } from "react";
import { scorePronunciation } from "@/lib/pronunciation";
import { speakText } from "@/lib/speech";

type RecognitionEvent = { results: { [index: number]: { [index: number]: { transcript: string } } } };
type Recognition = { lang:string; interimResults:boolean; continuous:boolean; onresult:((event:RecognitionEvent)=>void)|null; onerror:(()=>void)|null; onend:(()=>void)|null; start:()=>void };
type RecognitionConstructor = new()=>Recognition;

const missions = [
  { place:"School", placeTe:"పాఠశాల", icon:"🏫", title:"Meet a new classmate", turns:[
    {prompt:"Hello! What is your name?",te:"Hello! మీ పేరు ఏమిటి?",model:"My name is Hari.",keywords:["name","i am","my"]},
    {prompt:"Nice to meet you. Which class are you in?",te:"మిమ్మల్ని కలవడం సంతోషం. మీరు ఏ class లో ఉన్నారు?",model:"I am in class six.",keywords:["class","grade","six"]},
    {prompt:"What is your favourite subject?",te:"మీకు ఇష్టమైన subject ఏది?",model:"My favourite subject is English.",keywords:["favourite","subject","english"]},
  ]},
  { place:"Shop", placeTe:"దుకాణం", icon:"🛍️", title:"Buy something politely", turns:[
    {prompt:"Hello! How can I help you?",te:"Hello! మీకు ఏమి కావాలి?",model:"I would like a bottle of water.",keywords:["would like","want","water"]},
    {prompt:"Certainly. Would you like anything else?",te:"తప్పకుండా. ఇంకేమైనా కావాలా?",model:"No, thank you. How much is it?",keywords:["thank","how much","price"]},
    {prompt:"It is twenty rupees.",te:"ఇది ఇరవై రూపాయలు.",model:"Here you are. Thank you.",keywords:["here","thank","rupees"]},
  ]},
  { place:"Interview", placeTe:"ఇంటర్వ్యూ", icon:"💼", title:"Speak with confidence", turns:[
    {prompt:"Please tell me about yourself.",te:"మీ గురించి చెప్పండి.",model:"I am a hardworking student who enjoys learning.",keywords:["i am","student","learning"]},
    {prompt:"What is one of your strengths?",te:"మీ strength ఒకటి చెప్పండి.",model:"I am responsible and I work well with others.",keywords:["responsible","work","strength"]},
    {prompt:"Why do you want this opportunity?",te:"ఈ opportunity ఎందుకు కావాలి?",model:"I want to learn new skills and contribute to the team.",keywords:["learn","skills","team"]},
  ]},
] as const;

function speak(text:string){void speakText(text,{rate:.82})}

export default function SpeakingMissionCoach({day,completed,onComplete}:{day:number;completed:boolean;onComplete:(score:number,transcript:string)=>void}){
  const mission=missions[Math.min(missions.length-1,Math.floor((day-1)/10))];
  const [turn,setTurn]=useState(0);const [status,setStatus]=useState<"idle"|"listening"|"unsupported">("idle");const [transcript,setTranscript]=useState("");const [score,setScore]=useState<number|null>(null);const [finished,setFinished]=useState(false);
  const item=mission.turns[turn];
  const listen=()=>{const speechWindow=window as typeof window&{SpeechRecognition?:RecognitionConstructor;webkitSpeechRecognition?:RecognitionConstructor};const Constructor=speechWindow.SpeechRecognition||speechWindow.webkitSpeechRecognition;if(!Constructor){setStatus("unsupported");return;}window.speechSynthesis?.cancel();const recognition=new Constructor();recognition.lang="en-IN";recognition.interimResults=false;recognition.continuous=false;setStatus("listening");setTranscript("");setScore(null);recognition.onresult=(event)=>{const heard=event.results[0][0].transcript;const normalized=heard.toLowerCase();const keywordHits=item.keywords.filter(keyword=>normalized.includes(keyword)).length;const meaning=Math.round((keywordHits/item.keywords.length)*100);const pronunciation=scorePronunciation(item.model,heard);const result=Math.min(100,Math.round(meaning*.7+pronunciation*.3));setTranscript(heard);setScore(result);setStatus("idle");};recognition.onerror=()=>setStatus("idle");recognition.onend=()=>setStatus(value=>value==="listening"?"idle":value);recognition.start();};
  const next=()=>{if(turn<mission.turns.length-1){setTurn(value=>value+1);setTranscript("");setScore(null);speak(mission.turns[turn+1].prompt);}else{setFinished(true);onComplete(score||0,transcript);}};
  const reset=()=>{setTurn(0);setTranscript("");setScore(null);setFinished(false);setStatus("idle");};
  return <section className="speaking-mission-coach section-block" id="speaking-missions">
    <header><div><p className="kicker">Live speaking mission · మాట్లాడే సాధన</p><h2>Speak your way through a real situation</h2><p>No typing. Listen, answer aloud, and improve one reply at a time.</p></div><span>{mission.icon}<small>{mission.place}<br/><i lang="te">{mission.placeTe}</i></small></span></header>
    {!finished?<div className="mission-stage">
      <div className="mission-progress"><span>Turn {turn+1} of {mission.turns.length}</span><i><em style={{width:`${((turn+1)/mission.turns.length)*100}%`}}/></i><b>{mission.title}</b></div>
      <article className="coach-prompt"><span className="coach-avatar">T</span><div><small>Your coach asks</small><h3>“{item.prompt}”</h3><p lang="te">{item.te}</p><button type="button" onClick={()=>speak(item.prompt)}>🔊 Hear the coach</button></div></article>
      <article className="learner-reply"><div><small>Your turn</small><h3>Answer naturally in English</h3><p>Helpful model: “{item.model}”</p></div><button type="button" className={status==="listening"?"listening":""} onClick={listen}>{status==="listening"?"Listening…":"🎙️ Tap and speak"}</button></article>
      {status==="unsupported"&&<p className="mission-notice">Voice recognition works in Chrome or Edge. You can still hear and practise the model reply.</p>}
      {score!==null&&<div className={`mission-feedback ${score>=65?"good":"retry"}`}><div><strong>{score}%</strong><span>{score>=80?"Excellent natural answer!":score>=65?"Good answer—keep going.":"Good try—use one of the helpful words."}</span></div><p>You said: “{transcript}”</p><p lang="te">{score>=65?"చాలా బాగా చెప్పారు. Next reply కి వెళ్లండి.":"Model answer విని మరొక్కసారి ప్రయత్నించండి."}</p><div><button type="button" onClick={()=>speak(item.model)}>🔊 Hear model answer</button><button type="button" onClick={next} disabled={score<40}>{turn===mission.turns.length-1?"Finish mission":"Next reply →"}</button></div></div>}
    </div>:<div className="mission-complete"><span>🏆</span><h3>Speaking mission complete!</h3><p>You answered three real questions aloud. Your practice is saved.</p><p lang="te">మీరు మూడు questions కి English లో సమాధానం చెప్పారు. Practice save అయింది.</p><button type="button" onClick={reset}>Practise this mission again</button></div>}
    {completed&&!finished&&<span className="mission-saved">✓ Completed before · practise again any time</span>}
  </section>;
}
