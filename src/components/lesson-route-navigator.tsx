"use client";

import { useEffect, useMemo, useState } from "react";

type RouteStep = {
  key: string;
  number: string;
  label: string;
  labelTe: string;
  detail: string;
  done: boolean;
  target: string;
};

type Props = {
  day: number;
  steps: RouteStep[];
  onNavigate: (target: string) => void;
};

export default function LessonRouteNavigator({ day, steps, onNavigate }: Props) {
  const firstOpen = useMemo(() => Math.max(0, steps.findIndex((step) => !step.done)), [steps]);
  const [activeIndex, setActiveIndex] = useState(firstOpen);

  useEffect(() => {
    const sections = steps.map((step) => document.querySelector(step.target)).filter((section): section is Element => Boolean(section));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const index = steps.findIndex((step) => visible.target.matches(step.target));
      if (index >= 0) setActiveIndex(index);
    }, { rootMargin: "-18% 0px -62% 0px", threshold: [0, .15, .4] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [steps]);

  const active = steps[activeIndex] || steps[0];
  const moveTo = (index: number) => {
    const safeIndex = Math.max(0, Math.min(steps.length - 1, index));
    setActiveIndex(safeIndex);
    onNavigate(steps[safeIndex].target);
  };

  return (
    <nav className="lesson-route-navigator" aria-label="Guided lesson route">
      <div className="route-summary">
        <span><b>Day {day} route</b><small>Follow in this order</small></span>
        <strong>Step {activeIndex + 1} of {steps.length}</strong>
      </div>
      <div className="route-track" role="list">
        {steps.map((step, index) => <button type="button" role="listitem" key={step.key} className={`${step.done ? "done" : ""} ${index === activeIndex ? "active" : ""}`} aria-current={index === activeIndex ? "step" : undefined} onClick={() => moveTo(index)}><span>{step.done ? "✓" : step.number}</span><b>{step.label}</b><small lang="te">{step.labelTe}</small>{index < steps.length - 1 && <i aria-hidden="true">→</i>}</button>)}
      </div>
      <div className="route-controls">
        <button type="button" onClick={() => moveTo(activeIndex - 1)} disabled={activeIndex === 0}>← Previous</button>
        <span><b>{active.label}</b><small>{active.detail}</small></span>
        <button type="button" onClick={() => moveTo(activeIndex + 1)} disabled={activeIndex === steps.length - 1}>Next: {steps[activeIndex + 1]?.label || "Complete"} →</button>
      </div>
    </nav>
  );
}
