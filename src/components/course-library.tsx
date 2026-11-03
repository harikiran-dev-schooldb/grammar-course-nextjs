"use client";

import { useMemo, useState } from "react";
import { expandedUnits, type CourseLevel, type ExpandedUnit } from "@/data/expanded-curriculum";
import type { AgeMode } from "@/lib/progress";
import { speakText } from "@/lib/speech";

const levels:CourseLevel[]=["START","A1","A2","B1","B2"];
const typeNames=["Explore words","Read & listen","Speak & write","Checkpoint"];
const typeIcons=["🔤","🎧","🎙️","✓"];
function speak(text:string){void speakText(text,{rate:.8})}

export default function CourseLibrary({initialLevel,ageMode,completedSkills,onComplete,onBack}:{initialLevel:CourseLevel;ageMode:AgeMode;completedSkills:string[];onComplete:(key:string)=>void;onBack:()=>void}){
  const[level,setLevel]=useState<CourseLevel>(initialLevel);const[selected,setSelected]=useState<{unit:ExpandedUnit;index:number}|null>(null);const[writing,setWriting]=useState("");const[answer,setAnswer]=useState<number|null>(null);
  const units=expandedUnits.filter(unit=>unit.level===level);const completed=completedSkills.filter(key=>key.startsWith("curriculum-")).length;const currentKey=selected?`curriculum-${selected.unit.id}-${selected.index+1}`:"";
  const distractors=useMemo(()=>selected?expandedUnits.filter(unit=>unit.id!==selected.unit.id).slice(0,2).map(unit=>unit.model):[],[selected]);
  const finish=()=>{if(currentKey)onComplete(currentKey)};
  return <section className="course-library" aria-labelledby="library-heading">
    <header className="library-header"><button type="button" onClick={onBack}>← Level map</button><div><p className="kicker">120-lesson content library</p><h1 id="library-heading">Learn deeply, one unit at a time</h1><p>Every unit includes vocabulary, listening, reading, speaking, writing and a checkpoint.</p></div><div><strong>{completed}</strong><small>/ 120 complete</small></div></header>
    <nav className="library-levels" aria-label="Course levels">{levels.map(item=><button type="button" key={item} className={level===item?"active":""} onClick={()=>{setLevel(item);setSelected(null)}}>{item}<small>{expandedUnits.filter(unit=>unit.level===item).length*4} lessons</small></button>)}</nav>
    <div className="library-units">{units.map((unit,unitIndex)=><article key={unit.id}><header><span>{String(unitIndex+1).padStart(2,"0")}</span><div><small>{level} unit</small><h2>{unit.title}</h2><p lang="te">{unit.titleTe}</p></div><b>{unit.themes[ageMode]}</b></header><div>{unit.lessons.map((title,index)=>{const done=completedSkills.includes(`curriculum-${unit.id}-${index+1}`);return <button type="button" key={title} className={done?"done":""} onClick={()=>{setSelected({unit,index});setWriting("");setAnswer(null)}}><span>{done?"✓":typeIcons[index]}</span><div><small>{typeNames[index]}</small><strong>{title}</strong></div><b>→</b></button>})}</div></article>)}</div>
    {selected&&<div className="lesson-pack-overlay" role="dialog" aria-modal="true" aria-label={selected.unit.lessons[selected.index]}><section className="lesson-pack"><header><div><p className="kicker">{selected.unit.level} · {typeNames[selected.index]}</p><h2>{selected.unit.lessons[selected.index]}</h2><p>{selected.unit.title} · {selected.unit.themes[ageMode]}</p></div><button type="button" onClick={()=>setSelected(null)} aria-label="Close lesson">×</button></header>
      <div className="pack-teacher"><span>{typeIcons[selected.index]}</span><div><strong>Today&apos;s goal</strong><p>{selected.index===0?`Learn and use these essential ${selected.unit.title.toLowerCase()} words.`:selected.index===1?"Listen carefully, read the model and understand its meaning.":selected.index===2?"Respond in your own English using a complete idea.":"Show that you understand the unit's key sentence."}</p><p lang="te">{selected.unit.promptTe}</p></div></div>
      {selected.index===0&&<div className="pack-vocabulary">{selected.unit.vocabulary.map(word=><button type="button" key={word} onClick={()=>speak(word)}><span>{word}</span><small>🔊 listen</small></button>)}</div>}
      {selected.index===1&&<div className="pack-listening"><p>“{selected.unit.model}”</p><p lang="te">{selected.unit.modelTe}</p><button type="button" onClick={()=>speak(selected.unit.model)}>🔊 Listen to the sentence</button></div>}
      {selected.index===2&&<div className="pack-writing"><div><strong>Speaking prompt</strong><p>{selected.unit.prompt}</p><p lang="te">{selected.unit.promptTe}</p><button type="button" onClick={()=>speak(selected.unit.prompt)}>🔊 Hear prompt</button></div><label>Your answer<textarea value={writing} onChange={event=>setWriting(event.target.value)} placeholder="Write your answer, then say it aloud…"/></label><small>{writing.trim()?writing.trim().split(/\s+/).length:0} words · aim for 5 or more</small></div>}
      {selected.index===3&&<div className="pack-checkpoint"><h3>Which sentence belongs to this unit?</h3>{[selected.unit.model,...distractors].map((option,index)=><button type="button" key={option} className={answer===null?"":index===0?"correct":answer===index?"wrong":""} onClick={()=>setAnswer(index)}><span>{String.fromCharCode(65+index)}</span>{option}</button>)}{answer!==null&&<p>{answer===0?"Correct—checkpoint passed!":"Try again. Look for the sentence connected to this unit."}</p>}</div>}
      <footer><span>{completedSkills.includes(currentKey)?"✓ Completed and saved":"Progress saves offline and syncs to Neon"}</span><button type="button" onClick={finish} disabled={(selected.index===2&&writing.trim().split(/\s+/).filter(Boolean).length<5)||(selected.index===3&&answer!==0)}>{completedSkills.includes(currentKey)?"Completed ✓":"Complete lesson"}</button></footer>
    </section></div>}
  </section>
}
