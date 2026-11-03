"use client";

type Props = { onHome: () => void; onPath: () => void; onProgress: () => void; onPhonics: () => void };

const steps = [
  { icon: "1", title: "Start with Today", te: "Today పేజీతో మొదలుపెట్టండి", text: "Press Continue. The app chooses the right next activity, so you do not need to search.", textTe: "Continue నొక్కండి. తర్వాత ఏ activity చేయాలో app మీకు చూపిస్తుంది." },
  { icon: "2", title: "Learn the lesson", te: "పాఠాన్ని నేర్చుకోండి", text: "Listen to the teacher explanation, read the examples, and understand the Telugu meaning.", textTe: "Teacher explanation వినండి, examples చదవండి, తెలుగు అర్థం తెలుసుకోండి." },
  { icon: "3", title: "Practise", te: "Practice చేయండి", text: "Answer each question. A wrong answer is okay—the app explains and lets you try again.", textTe: "ప్రతి ప్రశ్నకు answer ఇవ్వండి. తప్పు వచ్చినా పరవాలేదు; మళ్లీ ప్రయత్నించండి." },
  { icon: "4", title: "Speak aloud", te: "బిగ్గరగా మాట్లాడండి", text: "Open the speaking activity, allow the microphone, listen once, and repeat clearly.", textTe: "Speaking activity తెరిచి microphone allow చేసి, ఒకసారి విని స్పష్టంగా పలకండి." },
  { icon: "5", title: "Finish the test", te: "Test పూర్తి చేయండి", text: "Complete the daily checkpoint and mark the lesson complete before moving ahead.", textTe: "Daily checkpoint పూర్తి చేసి lesson complete చేసిన తర్వాత ముందుకు వెళ్లండి." },
  { icon: "6", title: "Review weak skills", te: "తప్పులను మళ్లీ నేర్చుకోండి", text: "Review brings back difficult words and questions at the right time.", textTe: "కష్టమైన words, questions సరైన సమయంలో Review లో మళ్లీ వస్తాయి." },
  { icon: "7", title: "Learn every day", te: "ప్రతిరోజూ నేర్చుకోండి", text: "Fifteen to twenty minutes daily is better than a long session once a week.", textTe: "వారానికి ఒకసారి ఎక్కువసేపు కాకుండా, రోజూ 15–20 నిమిషాలు practice చేయండి." },
];

export default function UserGuide({ onHome, onPath, onProgress, onPhonics }: Props) {
  return <section className="user-guide" aria-labelledby="guide-title">
    <header className="guide-hero">
      <button type="button" onClick={onHome}>← Today</button>
      <div><p className="kicker">User guide · ఉపయోగించే విధానం</p><h1 id="guide-title">Learn English without getting lost</h1><p>Follow one clear path from your first sound to confident English.</p><p lang="te">మొదటి అక్షరం నుంచి ధైర్యంగా English మాట్లాడే వరకు ఒక స్పష్టమైన learning path.</p></div>
      <span aria-hidden="true">🧭</span>
    </header>

    <nav className="guide-quick-actions" aria-label="User guide quick actions">
      <button type="button" onClick={onHome}><span>▶</span><b>Start today</b><small>ఈ రోజు lesson</small></button>
      <button type="button" onClick={onPath}><span>🗺️</span><b>Open learning path</b><small>Learning order చూడండి</small></button>
      <button type="button" onClick={onProgress}><span>◔</span><b>See my progress</b><small>మీ progress చూడండి</small></button>
      <button type="button" onClick={onPhonics}><span>🔤</span><b>Open Phonics</b><small>Sounds నుంచి reading</small></button>
    </nav>

    <section className="guide-section">
      <div className="guide-heading"><p className="kicker">Your daily routine</p><h2>What to do, in the correct order</h2><p lang="te">ప్రతిరోజూ ఈ order లో activities పూర్తి చేయండి.</p></div>
      <div className="guide-steps">{steps.map((step) => <article key={step.icon}><span>{step.icon}</span><div><h3>{step.title}</h3><strong lang="te">{step.te}</strong><p>{step.text}</p><p lang="te">{step.textTe}</p></div></article>)}</div>
    </section>

    <section className="guide-section guide-levels">
      <div className="guide-heading"><p className="kicker">Where should I begin?</p><h2>Choose the right starting point</h2></div>
      <div>
        <article><span>🌱</span><h3>Cannot read simple words yet</h3><p>Begin with <b>Phonics Academy</b>: sounds, blending, first words and fluent reading.</p><p lang="te">చిన్న English words చదవలేకపోతే Phonics Academy నుంచి మొదలుపెట్టండి.</p></article>
        <article><span>📘</span><h3>Can read words like cat and school</h3><p>Begin with <b>START or A1</b>, then follow every unit in order.</p><p lang="te">cat, school లాంటి words చదవగలిగితే START లేదా A1 నుంచి మొదలుపెట్టండి.</p></article>
        <article><span>🚀</span><h3>Can speak short sentences</h3><p>Take the <b>placement test</b> and use its recommended level.</p><p lang="te">చిన్న sentences మాట్లాడగలిగితే placement test రాయండి.</p></article>
      </div>
    </section>

    <section className="guide-section guide-saving">
      <div><span>☁️</span><h2>Your progress saves automatically</h2><p>Every completed lesson and activity saves on this device. When you are online and logged in, it also syncs securely to Neon.</p><p lang="te">మీరు పూర్తి చేసిన lesson ఈ device లో save అవుతుంది. Internet వచ్చినప్పుడు Neon cloud కి sync అవుతుంది.</p></div>
      <div><span>📲</span><h2>Use the app offline</h2><p>While online, press <b>Download offline</b> in the side menu. Wait for the download to finish before going offline.</p><p lang="te">Internet ఉన్నప్పుడు side menu లో Download offline నొక్కి, download పూర్తయ్యే వరకు వేచి ఉండండి.</p></div>
    </section>

    <section className="guide-section guide-faq">
      <div className="guide-heading"><p className="kicker">Quick help</p><h2>Common questions</h2></div>
      <details><summary>Do I need to finish everything in one day?<span>+</span></summary><p>No. Complete one guided lesson or study for 15–20 minutes. Your place is saved automatically.</p><p lang="te">అవసరం లేదు. రోజుకు ఒక lesson లేదా 15–20 నిమిషాలు నేర్చుకుంటే చాలు.</p></details>
      <details><summary>What if I give a wrong answer?<span>+</span></summary><p>Read the explanation and try again. Mistakes are added to Review so you can master them later.</p><p lang="te">Explanation చదివి మళ్లీ try చేయండి. తప్పులు Review లో మళ్లీ practice కి వస్తాయి.</p></details>
      <details><summary>Why is the microphone not working?<span>+</span></summary><p>Open your browser settings and allow microphone access for Grammar Studio, then reload the app.</p><p lang="te">Browser settings లో Grammar Studio కి microphone permission ఇచ్చి app reload చేయండి.</p></details>
      <details><summary>Can children and adults use the same course?<span>+</span></summary><p>Yes. Open the Path and choose Kids, Teens or Adults to change the lesson situations.</p><p lang="te">అవును. Path లో Kids, Teens లేదా Adults mode ఎంచుకోండి.</p></details>
    </section>

    <footer className="guide-finish"><div><p className="kicker">Ready?</p><h2>Take one small step today.</h2><p lang="te">ఈ రోజు ఒక చిన్న అడుగు వేయండి.</p></div><button type="button" onClick={onHome}>Start today’s lesson →</button></footer>
  </section>;
}
