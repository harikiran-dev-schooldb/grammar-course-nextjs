"use client";

import type { AgeMode, PlacementLevel, ReadingLevel } from "@/lib/progress";

type Level = {
  code:string; title:string; titleTe:string; icon:string; color:string; range:[number,number]|null; checkpoint:number|null;
  units:{title:string;kid:string;teen:string;adult:string;days:string;start:number|null}[];
};

const levels:Level[]=[
  {code:"START",title:"Pre-reader",titleTe:"చదవడం ప్రారంభం",icon:"🔤",color:"starter",range:null,checkpoint:null,units:[
    {title:"Letters & sounds",kid:"Alphabet games",teen:"Sound foundations",adult:"Clear letter sounds",days:"ABC",start:null},
    {title:"First words",kid:"Picture words",teen:"Essential words",adult:"Everyday basics",days:"Words",start:null},
    {title:"Reading adventure",kid:"Mini story worlds",teen:"Short story practice",adult:"Practical reading",days:"Stories",start:null},
  ]},
  {code:"A1",title:"Beginner",titleTe:"ప్రాథమిక స్థాయి",icon:"🌱",color:"a1",range:[1,7],checkpoint:7,units:[
    {title:"People & things",kid:"My world",teen:"Friends and school",adult:"People and objects",days:"Days 1–3",start:1},
    {title:"Describe the world",kid:"Tell me about it",teen:"Describe your life",adult:"Clear descriptions",days:"Days 4–6",start:4},
    {title:"A1 checkpoint",kid:"Star challenge",teen:"Level challenge",adult:"Foundation review",days:"Day 7",start:7},
  ]},
  {code:"A2",title:"Elementary",titleTe:"రోజువారీ English",icon:"🚲",color:"a2",range:[8,14],checkpoint:14,units:[
    {title:"Routines & questions",kid:"My day",teen:"School and routines",adult:"Daily conversations",days:"Days 8–10",start:8},
    {title:"Actions happening now",kid:"What are they doing?",teen:"Life right now",adult:"Current activities",days:"Days 11–13",start:11},
    {title:"A2 checkpoint",kid:"Adventure quiz",teen:"Level challenge",adult:"Everyday review",days:"Day 14",start:14},
  ]},
  {code:"B1",title:"Intermediate",titleTe:"ధైర్యంగా మాట్లాడటం",icon:"🚀",color:"b1",range:[15,21],checkpoint:21,units:[
    {title:"Tell past stories",kid:"Yesterday's adventure",teen:"Stories and experiences",adult:"Past events",days:"Days 15–18",start:15},
    {title:"Plans & predictions",kid:"My future",teen:"Goals and plans",adult:"Future decisions",days:"Days 19–20",start:19},
    {title:"B1 checkpoint",kid:"Story mission",teen:"Speaking challenge",adult:"Fluency review",days:"Day 21",start:21},
  ]},
  {code:"B2",title:"Upper-intermediate",titleTe:"Advanced expression",icon:"🏆",color:"b2",range:[22,30],checkpoint:30,units:[
    {title:"Place, time & advice",kid:"Where and when",teen:"Plans and advice",adult:"Precise communication",days:"Days 22–24",start:22},
    {title:"Compare & connect ideas",kid:"Bigger, best, because",teen:"Opinions and comparisons",adult:"Connected expression",days:"Days 25–28",start:25},
    {title:"B2 mastery",kid:"Champion challenge",teen:"Final challenge",adult:"Course assessment",days:"Days 29–30",start:29},
  ]},
];

const modeCopy=(unit:Level["units"][number],mode:AgeMode)=>mode==="kids"?unit.kid:mode==="teens"?unit.teen:unit.adult;

export default function CurriculumPath({ageMode,readingLevel,placementLevel,completedDays,foundationCount,checkpointScores,offlineReady,onAgeMode,onOpenDay,onOpenStarter,onPlacement,onDownload,onHome,onOpenLibrary}:{ageMode:AgeMode;readingLevel:ReadingLevel|null;placementLevel:PlacementLevel|null;completedDays:number[];foundationCount:number;checkpointScores:Record<number,number>;offlineReady:boolean;onAgeMode:(mode:AgeMode)=>void;onOpenDay:(day:number)=>void;onOpenStarter:()=>void;onPlacement:()=>void;onDownload:()=>void;onHome:()=>void;onOpenLibrary:(level:"START"|"A1"|"A2"|"B1"|"B2")=>void}){
  const progress=(level:Level)=>level.range?Math.round((completedDays.filter(day=>day>=level.range![0]&&day<=level.range![1]).length/(level.range[1]-level.range[0]+1))*100):Math.min(100,Math.round((foundationCount/18)*100));
  const unlocked=(index:number)=>index===0||(index===1&&Boolean(readingLevel))||(index===2&&(completedDays.includes(7)||placementLevel==="everyday"||placementLevel==="confident"))||(index===3&&(completedDays.includes(14)||placementLevel==="confident"))||(index===4&&(completedDays.includes(21)||placementLevel==="confident"));
  return <section className="curriculum-path" aria-labelledby="curriculum-heading">
    <header className="curriculum-header"><button type="button" onClick={onHome}>← Today</button><div><p className="kicker">Complete English pathway</p><h1 id="curriculum-heading">From first sounds to confident expression</h1><p>Five levels, clear units, and checkpoints show exactly what comes next.</p><p lang="te">ప్రతి level, unit, checkpoint ఒక సరైన order లో పూర్తి చేయండి.</p></div><button type="button" className="placement-shortcut" onClick={onPlacement}>🧭 {placementLevel?"Retake placement":"Find my level"}</button></header>
    <div className="learner-mode"><div><strong>Choose the learner experience</strong><small>Lesson themes adapt; learning goals stay equally strong.</small></div><div>{(["kids","teens","adults"] as AgeMode[]).map(mode=><button type="button" key={mode} className={ageMode===mode?"active":""} onClick={()=>onAgeMode(mode)}><span>{mode==="kids"?"🧸":mode==="teens"?"🎒":"💼"}</span>{mode.charAt(0).toUpperCase()+mode.slice(1)}</button>)}</div></div>
    <div className="offline-pack"><span>{offlineReady?"✓":"↓"}</span><div><strong>{offlineReady?"English course available offline":"Download the complete offline pack"}</strong><small>Lessons, progress and 420 English/Telugu audio clips.</small></div>{!offlineReady&&<button type="button" onClick={onDownload}>Download once</button>}</div>
    <div className="level-roadmap">{levels.map((level,index)=>{const open=unlocked(index);const value=progress(level);const checkpoint=level.checkpoint?checkpointScores[level.checkpoint]||0:0;return <article key={level.code} className={`level-card ${level.color} ${open?"unlocked":"locked"}`}>
      <div className="level-rail"><span>{open?level.icon:"🔒"}</span><i><em style={{height:`${value}%`}}/></i><b>{value}%</b></div>
      <div className="level-content"><header><div><small>{level.code} level</small><h2>{level.title}</h2><p lang="te">{level.titleTe}</p></div><div className="level-header-actions"><span>{open?value===100?"Complete":"Available":"Complete previous level"}</span><button type="button" onClick={()=>onOpenLibrary(level.code as "START"|"A1"|"A2"|"B1"|"B2")}>View 24 lessons →</button></div></header>
      <div className="curriculum-units">{level.units.map((unit,unitIndex)=>{const unitDone=unit.start?completedDays.includes(unit.start):foundationCount>unitIndex*4;return <button type="button" key={unit.title} disabled={!open} onClick={()=>unit.start?onOpenDay(unit.start):onOpenStarter()}><span>{unitDone?"✓":unitIndex+1}</span><div><small>{unit.days}</small><strong>{unit.title}</strong><p>{modeCopy(unit,ageMode)}</p></div><b>→</b></button>})}</div>
      {level.checkpoint&&<footer><span>Checkpoint score <b>{checkpoint?`${checkpoint}%`:"Not taken"}</b></span><small>{checkpoint>=70?"✓ Mastery gate passed":"Score 70% to confirm this level"}</small></footer>}
      {!open&&<div className="level-lock-note">Finish the previous checkpoint or use placement to unlock this level.</div>}
      </div>
    </article>})}</div>
  </section>;
}
