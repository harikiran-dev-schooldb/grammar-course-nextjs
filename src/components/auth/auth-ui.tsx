"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { passwordGuidance } from "@/lib/password-guidance";

type FieldIcon = "user" | "mail";
type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  hint?: string;
  icon?: FieldIcon;
};

function FieldSymbol({ name }: { name: FieldIcon }) {
  return name === "mail" ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c.8-4.2 3.3-6 7.5-6s6.7 1.8 7.5 6" />
    </svg>
  );
}

export function AuthField({ id, label, hint, icon = "user", ...props }: AuthFieldProps) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <span className="auth-field-icon"><FieldSymbol name={icon} /></span>
        <input id={id} aria-describedby={hint ? id + "-hint" : undefined} {...props} />
      </div>
      {hint && <p id={id + "-hint"} className="auth-field-hint">{hint}</p>}
    </div>
  );
}

type PasswordProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> & {
  id: string;
  label: string;
};

export function AuthPasswordField({ id, label, ...props }: PasswordProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input-wrap auth-password-wrap">
        <span className="auth-field-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="5" y="10" width="14" height="11" rx="2.5" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <input id={id} type={visible ? "text" : "password"} {...props} />
        <button type="button" className="auth-password-toggle" onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide " + label.toLowerCase() : "Show " + label.toLowerCase()}
          aria-pressed={visible} aria-controls={id}>
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  const advice = passwordGuidance(password);
  if (!password) {
    return <p className="auth-password-advice">Use 12+ characters for a stronger password. A memorable passphrase works well.</p>;
  }
  return (
    <div className="auth-password-strength" aria-live="polite">
      <div className="auth-strength-heading">
        <span>Password guidance</span>
        <strong>{advice.label}</strong>
      </div>
      <div className="auth-strength-track" role="img" aria-label={advice.label + " password strength estimate"}>
        {[0, 1, 2, 3].map((part) => (
          <span key={part} className={part < advice.score ? "filled strength-" + advice.score : ""} />
        ))}
      </div>
      <p>{advice.message}</p>
    </div>
  );
}

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-screen">
      <div className="auth-layout">
        <section className="auth-panel">
          <div className="auth-panel-inner">
            <header className="auth-brand">
              <span className="auth-brand-mark" aria-hidden="true">G<span>.</span></span>
              <span className="auth-brand-copy"><strong>Grammar Studio</strong><small>COMPLETE ENGLISH · సంపూర్ణ ఇంగ్లీష్</small></span>
            </header>
            {children}
            <footer className="auth-bottom-note">
              <span className="auth-safe-mark" aria-hidden="true">✓</span>
              <span>Your learning progress stays connected to your Neon account. Passwords are managed by Neon Auth.</span>
            </footer>
          </div>
        </section>

        <aside className="auth-showcase" aria-label="About the Grammar Studio course">
          <div className="auth-showcase-top"><span className="auth-course-pill">YOUR 30-DAY ENGLISH JOURNEY</span><span className="auth-showcase-language">English <span>×</span> తెలుగు</span></div>
          <div className="auth-showcase-center">
            <span className="auth-showcase-eyebrow">Small lessons. Real confidence.</span>
            <h2>Speak better.<br /><em>Every day.</em></h2>
            <p>From your first sentence to confident conversations. Learn in English and Telugu, at your own pace.</p>
            <div className="auth-course-steps">
              <div><span>01</span><strong>Understand</strong><small>Short lessons & clear examples</small></div>
              <div><span>02</span><strong>Practise</strong><small>Speak, listen, read & write</small></div>
              <div><span>03</span><strong>Grow</strong><small>Daily tests & smart revision</small></div>
            </div>
          </div>
          <div className="auth-showcase-bottom"><span>30 guided days</span><span>•</span><span>Bilingual learning</span><span>•</span><span>Practice offline</span></div>
        </aside>
      </div>
    </main>
  );
}
