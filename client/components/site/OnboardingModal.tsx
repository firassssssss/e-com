"use client";
import { useState } from "react";
import api from "@/lib/api";
import { profileEvents } from "@/lib/profileEvents";

const STEPS = [
  {
    key: "skinType",
    question: "What's your skin type?",
    subtitle: "We'll tailor every recommendation to your skin.",
    options: [
      { value: "oily", label: "Oily", hint: "Shiny by midday" },
      { value: "dry", label: "Dry", hint: "Tight, flaky patches" },
      { value: "combination", label: "Combination", hint: "Oily T-zone, dry cheeks" },
      { value: "sensitive", label: "Sensitive", hint: "Reacts easily" },
      { value: "normal", label: "Normal", hint: "Balanced, few issues" },
    ],
  },
  {
    key: "hairType",
    question: "How about your hair?",
    subtitle: "For personalized hair care picks too.",
    options: [
      { value: "dry", label: "Dry", hint: "Frizzy, brittle" },
      { value: "oily", label: "Oily", hint: "Greasy fast" },
      { value: "curly", label: "Curly", hint: "Coily or wavy" },
      { value: "fine", label: "Fine", hint: "Thin, flat" },
      { value: "normal", label: "Normal", hint: "Easy to manage" },
    ],
  },
  {
    key: "skinConcerns",
    question: "Your main skin concern?",
    subtitle: "Pick what bothers you most.",
    options: [
      { value: "acne", label: "Acne", hint: "Breakouts & blemishes" },
      { value: "aging", label: "Aging", hint: "Fine lines, firmness" },
      { value: "dullness", label: "Dullness", hint: "Uneven, tired tone" },
      { value: "hyperpigmentation", label: "Dark spots", hint: "Post-acne marks" },
      { value: "dehydration", label: "Dehydration", hint: "Thirsty skin" },
      { value: "redness", label: "Redness", hint: "Irritation & rosacea" },
    ],
  },
  {
    key: "discoverySource",
    question: "How did you find us?",
    subtitle: "Helps us understand our community.",
    options: [
      { value: "instagram", label: "Instagram" },
      { value: "tiktok", label: "TikTok" },
      { value: "friend", label: "A friend" },
      { value: "search", label: "Search engine" },
      { value: "ad", label: "An ad" },
      { value: "other", label: "Other" },
    ],
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingModal({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const selected = answers[current.key];
  const isLast = step === STEPS.length - 1;

  const choose = (val: string) => {
    setAnswers((p) => ({ ...p, [current.key]: val }));
  };

  const next = async () => {
    if (!selected) return;
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setSaving(true);
    try {
      await api.put("/api/v1/users/me", {
        skinType: answers.skinType,
        hairType: answers.hairType,
        skinConcerns: answers.skinConcerns,
        discoverySource: answers.discoverySource,
        onboardingDone: true,
      });
      profileEvents.emit();
    } catch {
      // non-fatal
    } finally {
      setSaving(false);
      onComplete();
    }
  };

  const skip = () => onComplete();

  const progress = ((step + (selected ? 1 : 0)) / STEPS.length) * 100;

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        {/* Progress bar */}
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressBar, width: `${progress}%` }} />
        </div>

        {/* Step counter */}
        <p style={styles.stepLabel}>
          {step + 1} of {STEPS.length}
        </p>

        {/* Question */}
        <h2 style={styles.question}>{current.question}</h2>
        <p style={styles.subtitle}>{current.subtitle}</p>

        {/* Options */}
        <div style={styles.grid}>
          {current.options.map((opt) => {
            const active = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => choose(opt.value)}
                style={{
                  ...styles.option,
                  ...(active ? styles.optionActive : {}),
                }}
              >
                <span style={styles.optionLabel}>{opt.label}</span>
                {"hint" in opt && opt.hint && (
                  <span style={styles.optionHint}>{opt.hint}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button onClick={skip} style={styles.skipBtn}>
            Skip for now
          </button>
          <button
            onClick={next}
            disabled={!selected || saving}
            style={{
              ...styles.nextBtn,
              ...(!selected || saving ? styles.nextBtnDisabled : {}),
            }}
          >
            {saving ? "Savingâ€¦" : isLast ? "Finish" : "Continue"}
          </button>
        </div>

        {/* Dots */}
        <div style={styles.dots}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.dot,
                ...(i === step ? styles.dotActive : {}),
                ...(i < step ? styles.dotDone : {}),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(26,20,16,0.55)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  modal: {
    background: "#FAF7F2",
    borderRadius: "4px",
    padding: "2.5rem 2rem 2rem",
    width: "100%",
    maxWidth: "480px",
    position: "relative",
  },
  progressTrack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
    background: "#E0D5C8",
    borderRadius: "4px 4px 0 0",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    background: "#C4786A",
    transition: "width 0.4s ease",
  },
  stepLabel: {
    fontSize: "11px",
    letterSpacing: "0.2em",
    color: "#6B4F3A",
    opacity: 0.5,
    margin: "0 0 1.25rem",
    textTransform: "uppercase",
  },
  question: {
    fontFamily: "Georgia, serif",
    fontSize: "26px",
    fontWeight: 300,
    color: "#1A1410",
    margin: "0 0 0.4rem",
    lineHeight: 1.25,
  },
  subtitle: {
    fontSize: "13px",
    color: "#6B4F3A",
    opacity: 0.6,
    margin: "0 0 1.75rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "2rem",
  },
  option: {
    border: "1px solid #E0D5C8",
    background: "transparent",
    borderRadius: "2px",
    padding: "12px 14px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  optionActive: {
    background: "#1A1410",
    borderColor: "#1A1410",
  },
  optionLabel: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#1A1410",
  },
  optionHint: {
    fontSize: "11px",
    color: "#6B4F3A",
    opacity: 0.6,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
  },
  skipBtn: {
    background: "none",
    border: "none",
    fontSize: "12px",
    color: "#6B4F3A",
    opacity: 0.5,
    cursor: "pointer",
    padding: 0,
    letterSpacing: "0.05em",
  },
  nextBtn: {
    background: "#1A1410",
    color: "#FAF7F2",
    border: "none",
    borderRadius: "2px",
    padding: "10px 28px",
    fontSize: "12px",
    letterSpacing: "0.15em",
    cursor: "pointer",
    textTransform: "uppercase",
    transition: "background 0.2s",
  },
  nextBtnDisabled: {
    opacity: 0.35,
    cursor: "default",
  },
  dots: {
    display: "flex",
    justifyContent: "center",
    gap: "6px",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#E0D5C8",
    transition: "all 0.2s",
  },
  dotActive: {
    background: "#C4786A",
    width: "18px",
    borderRadius: "3px",
  },
  dotDone: {
    background: "#1A1410",
    opacity: 0.3,
  },
};

