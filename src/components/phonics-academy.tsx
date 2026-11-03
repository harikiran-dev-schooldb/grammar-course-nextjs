"use client";

import { useMemo, useState } from "react";
import { phonicsActivityCount, phonicsStages } from "@/data/phonics-course";
import { speakText } from "@/lib/speech";

type Props = { completedSkills: string[]; onComplete: (key: string) => void; onBack: () => void };
type Activity = "learn" | "blend" | "check";

export default function PhonicsAcademy({ completedSkills, onComplete, onBack }: Props) {
  const [stageIndex, setStageIndex] = useState(0);
  const [activity, setActivity] = useState<Activity>("learn");
  const [answer, setAnswer] = useState<number | null>(null);
  const stage = phonicsStages[stageIndex];
  const key = (kind: Activity) => `phonics-${stage.id}-${kind}`;
  const completed = useMemo(() => completedSkills.filter((item) => item.startsWith("phonics-")).length, [completedSkills]);
  const speak = (text: string) => { void speakText(text,{rate:.72}); };
  const finish = (kind: Activity) => onComplete(key(kind));
  const openStage = (index: number) => { setStageIndex(index); setActivity("learn"); setAnswer(null); window.scrollTo({top:0,behavior:"smooth"}); };
  const nextStage = () => openStage((stageIndex + 1) % phonicsStages.length);

  return <section className="phonics-academy" aria-labelledby="phonics-title">
    <header className="phonics-hero"><button type="button" onClick={onBack}>← Learning home</button><div><p className="kicker">Phonics Academy · Sounds to reading</p><h1 id="phonics-title">Hear it. Blend it. Read it.</h1><p>12 carefully ordered stages build confident reading from first sounds to fluent sentences.</p><p lang="te">మొదటి sound నుంచి sentences ధైర్యంగా చదివే వరకు 12 steps లో నేర్చుకోండి.</p></div><div className="phonics-score"><strong>{completed}</strong><small>/ {phonicsActivityCount}<br/>activities</small></div></header>

    <div className="phonics-layout">
      <nav className="phonics-stage-list" aria-label="Phonics stages">{phonicsStages.map((item,index)=>{const count=(["learn","blend","check"] as Activity[]).filter((kind)=>completedSkills.includes(`phonics-${item.id}-${kind}`)).length;return <button type="button" key={item.id} className={index===stageIndex?"active":""} onClick={()=>openStage(index)}><span>{count===3?"✓":index+1}</span><div><small>{item.level} · {count}/3</small><b>{item.title}</b><i lang="te">{item.titleTe}</i></div></button>})}</nav>

      <main className="phonics-player">
        <header><div><p className="kicker">{stage.level} of 12</p><h2>{stage.title}</h2><p lang="te">{stage.titleTe}</p></div><span>{stageIndex+1}/12</span></header>
        <div className="phonics-goal"><b>Today&apos;s goal</b><p>{stage.goal}</p><p lang="te">{stage.goalTe}</p></div>
        <nav className="phonics-tabs" aria-label="Phonics activity"><button type="button" className={activity==="learn"?"active":""} onClick={()=>setActivity("learn")}><span>{completedSkills.includes(key("learn"))?"✓":"1"}</span>Learn sounds</button><button type="button" className={activity==="blend"?"active":""} onClick={()=>setActivity("blend")}><span>{completedSkills.includes(key("blend"))?"✓":"2"}</span>Blend a word</button><button type="button" className={activity==="check"?"active":""} onClick={()=>{setActivity("check");setAnswer(null)}}><span>{completedSkills.includes(key("check"))?"✓":"3"}</span>Quick check</button></nav>

        {activity==="learn"&&<section className="phonics-activity"><div className="activity-intro"><div><p className="kicker">Listen and repeat</p><h3>Tap every sound card</h3><p lang="te">ప్రతి sound card నొక్కి, విని, బిగ్గరగా పలకండి.</p></div><button type="button" onClick={()=>speak(stage.patterns.map((item)=>`${item.cue}, as in ${item.words[0]}`).join(". "))}>🔊 Play all</button></div><div className="sound-card-grid">{stage.patterns.map((item)=><button type="button" key={`${item.sound}-${item.words[0]}`} onClick={()=>speak(`${item.cue}, as in ${item.words[0]}. ${item.words.join(", ")}`)}><strong>{item.sound}</strong><span>🔊 {item.cue}</span><small>{item.words.join(" · ")}</small></button>)}</div><button type="button" className="phonics-complete" onClick={()=>{finish("learn");setActivity("blend")}}>{completedSkills.includes(key("learn"))?"Practised ✓":"I listened and repeated →"}</button></section>}

        {activity==="blend"&&<section className="phonics-activity blend-activity"><div className="activity-intro"><div><p className="kicker">Sound by sound</p><h3>Slide the sounds together</h3><p lang="te">Sounds ని విడిగా పలికి, తర్వాత కలిపి word చెప్పండి.</p></div><button type="button" onClick={()=>speak(`${stage.blend.parts.join(". ")}. ${stage.blend.word}`)}>🔊 Hear blend</button></div><div className="blend-builder"><div>{stage.blend.parts.map((part)=><button type="button" key={part} onClick={()=>speak(part)}>{part}</button>)}<span>→</span><strong>{stage.blend.word}</strong></div><p>{stage.blend.meaning}</p><button type="button" onClick={()=>speak(stage.blend.word)}>🔊 Hear the whole word</button></div><div className="read-sentence"><small>Now read the sentence</small><p>“{stage.sentence}”</p><button type="button" onClick={()=>speak(stage.sentence)}>🔊 Listen, then read</button></div><button type="button" className="phonics-complete" onClick={()=>{finish("blend");setActivity("check");setAnswer(null)}}>{completedSkills.includes(key("blend"))?"Blended ✓":"I blended and read it →"}</button></section>}

        {activity==="check"&&<section className="phonics-activity check-activity"><div className="activity-intro"><div><p className="kicker">Quick check</p><h3>{stage.question}</h3><p lang="te">సరైన answer ఎంచుకోండి.</p></div><button type="button" onClick={()=>speak(stage.question)}>🔊 Hear question</button></div><div className="phonics-options">{stage.choices.map((choice,index)=><button type="button" key={choice} className={answer===index?(index===stage.answer?"correct":"wrong"):""} onClick={()=>setAnswer(index)}>{choice}</button>)}</div>{answer!==null&&<div className={`phonics-feedback ${answer===stage.answer?"correct":"retry"}`} role="status"><strong>{answer===stage.answer?"Excellent! చాలా బాగా చెప్పారు!":"Almost—listen and try once more."}</strong><p>{answer===stage.answer?`“${stage.choices[stage.answer]}” is correct.`:"మళ్లీ sound విని సరైన word ఎంచుకోండి."}</p></div>}<button type="button" className="phonics-complete" disabled={answer!==stage.answer} onClick={()=>{finish("check");nextStage()}}>Complete stage & continue →</button></section>}
      </main>
    </div>
  </section>;
}
