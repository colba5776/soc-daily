"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitAnswer } from "@/app/actions";
import { liveStreak, recordGuestResult, useGuestStats } from "@/lib/guest-stats";
import { attackUrl, CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/lib/labels";
import type { AnswerResult, PublicChallenge } from "@/lib/types";
import { Countdown } from "./Countdown";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

interface Props {
  challenge: PublicChallenge;
  signedIn: boolean;
  accountsEnabled: boolean;
  /** Signed-in user who already answered today. */
  initialResult: AnswerResult | null;
}

export function AnswerPanel({ challenge, signedIn, accountsEnabled, initialResult }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<AnswerResult | null>(null);
  const [serverStreak, setServerStreak] = useState<number | null>(initialResult?.streak?.current ?? null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Guests: today's result may already be saved in this browser.
  const guest = useGuestStats();
  const guestDay = !signedIn ? guest?.history[challenge.publishDate] : undefined;
  const guestResult: AnswerResult | null =
    guestDay && guestDay.challengeId === challenge.id ? { ...guestDay } : null;

  const result = submitted ?? initialResult ?? guestResult;
  const selected = result ? result.selectedIndex : picked;
  const streak = signedIn
    ? serverStreak
    : guest && result
      ? liveStreak(guest, challenge.publishDate)
      : null;
  const setSelected = setPicked;

  function handleSubmit() {
    if (selected === null || result) return;
    setError(null);
    startTransition(async () => {
      const res = await submitAnswer(challenge.id, selected);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (signedIn) {
        setServerStreak(res.result.streak?.current ?? null);
      } else {
        recordGuestResult(challenge.publishDate, challenge.number, res.result);
      }
      setSubmitted(res.result);
    });
  }

  async function handleShare() {
    if (!result) return;
    const text = [
      `SOC Daily #${challenge.number} ${result.isCorrect ? "✅" : "❌"}`,
      `${CATEGORY_LABELS[challenge.category]} · ${DIFFICULTY_LABELS[challenge.difficulty]}`,
      streak ? `🔥 ${streak} day streak` : null,
      window.location.origin,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your result:", text);
    }
  }

  const answered = result !== null;

  return (
    <section aria-labelledby="question" className="space-y-4">
      <h2 id="question" className="text-lg font-semibold leading-snug text-text">
        {challenge.question}
      </h2>

      <div role="radiogroup" aria-label="Answer choices" className="grid gap-2.5">
        {challenge.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isCorrect = answered && i === result.correctIndex;
          const isWrongPick = answered && isSelected && !result.isCorrect;

          let tone =
            "border-line bg-panel hover:border-line-strong hover:bg-panel-2 text-text";
          if (!answered && isSelected) tone = "border-signal/70 bg-signal-dim/40 text-text ring-1 ring-signal/40";
          if (answered) tone = "border-line bg-panel text-muted opacity-60";
          if (isCorrect) tone = "border-signal/70 bg-signal-dim/50 text-text opacity-100";
          if (isWrongPick) tone = "border-alert/70 bg-alert-dim/60 text-text opacity-100";

          let badge = "border-line-strong text-muted";
          if (!answered && isSelected) badge = "border-signal bg-signal text-bg";
          if (isCorrect) badge = "border-signal bg-signal text-bg";
          if (isWrongPick) badge = "border-alert bg-alert text-bg";

          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={answered || isPending}
              onClick={() => setSelected(i)}
              className={`group flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left text-[15px] leading-snug transition-colors disabled:cursor-default ${tone}`}
            >
              <span
                className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded border font-mono text-xs font-semibold ${badge}`}
              >
                {isCorrect ? "✓" : isWrongPick ? "✕" : LETTERS[i]}
              </span>
              <span className="pt-0.5">{choice}</span>
            </button>
          );
        })}
      </div>

      {!answered && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected === null || isPending}
            className="rounded-lg bg-signal px-5 py-2.5 font-mono text-sm font-semibold text-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-faint"
          >
            {isPending ? "Checking…" : "Submit verdict"}
          </button>
          <span className="text-xs text-faint">
            {selected === null ? "Pick an answer. You get one shot." : "Your first answer is final."}
          </span>
          {error && <p className="w-full text-sm text-alert">{error}</p>}
        </div>
      )}

      {answered && (
        <div className="animate-reveal space-y-4 pt-2">
          <div
            className={`rounded-lg border p-4 sm:p-5 ${
              result.isCorrect ? "border-signal/40 bg-signal-dim/30" : "border-alert/40 bg-alert-dim/40"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={`font-mono text-sm font-semibold ${result.isCorrect ? "text-signal" : "text-alert"}`}>
                {result.isCorrect ? "▲ CORRECT: good call, analyst." : `▼ INCORRECT: the answer was ${LETTERS[result.correctIndex]}.`}
              </p>
              {result.attackTechnique && (
                <a
                  href={attackUrl(result.attackTechnique)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border border-line-strong bg-bg/60 px-2 py-0.5 font-mono text-xs text-muted hover:border-info hover:text-info"
                >
                  ATT&amp;CK {result.attackTechnique} ↗
                </a>
              )}
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-text/90">{result.explanation}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Streak" value={streak !== null ? `${streak} 🔥` : "–"} />
            <div className="rounded-lg border border-line bg-panel p-3">
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Next challenge</p>
              <p className="mt-1 font-mono text-lg text-text">
                <Countdown />
              </p>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="rounded-lg border border-line-strong bg-panel-2 p-3 text-left transition hover:border-signal"
            >
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Share</p>
              <p className="mt-1 font-mono text-lg text-signal">{copied ? "Copied ✓" : "Copy result"}</p>
            </button>
          </div>

          {!signedIn && accountsEnabled && (
            <p className="text-sm text-muted">
              Playing as a guest, so your streak is saved in this browser only.{" "}
              <Link href="/login" className="text-signal underline underline-offset-2">
                Sign in
              </Link>{" "}
              to keep it across devices.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-3">
      <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{label}</p>
      <p className="mt-1 font-mono text-lg text-text">{value}</p>
    </div>
  );
}
