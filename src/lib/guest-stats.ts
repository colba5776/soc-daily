"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { AnswerResult } from "./types";

/**
 * Guest progress lives in this browser's localStorage, so people can play
 * without an account. Every read and write is wrapped in try/catch because
 * storage can be blocked (private windows, strict privacy settings).
 */

const KEY = "socdaily:v1";

export interface GuestDay {
  challengeId: string;
  number: number;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
  attackTechnique: string | null;
}

export interface GuestStats {
  history: Record<string, GuestDay>; // keyed by publish date YYYY-MM-DD
  currentStreak: number;
  longestStreak: number;
  lastPlayed: string | null;
}

const empty = (): GuestStats => ({
  history: {},
  currentStreak: 0,
  longestStreak: 0,
  lastPlayed: null,
});

function dayDiff(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): GuestStats {
  if (!raw) return empty();
  try {
    return { ...empty(), ...(JSON.parse(raw) as GuestStats) };
  } catch {
    return empty();
  }
}

export function loadGuestStats(): GuestStats {
  return parse(readRaw());
}

// A tiny store so React components re-render when stats change
// (including from another tab, via the "storage" event).
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

const SERVER = "__server__";

/** Guest stats for this browser, or null during server render and hydration. */
export function useGuestStats(): GuestStats | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => SERVER);
  return useMemo(() => (raw === SERVER ? null : parse(raw)), [raw]);
}

/** Current streak, treating it as broken if the player skipped a day. */
export function liveStreak(stats: GuestStats, today: string): number {
  if (!stats.lastPlayed) return 0;
  return dayDiff(stats.lastPlayed, today) <= 1 ? stats.currentStreak : 0;
}

export function recordGuestResult(
  date: string,
  number: number,
  result: AnswerResult,
): GuestStats {
  const stats = loadGuestStats();
  if (stats.history[date]) return stats; // first answer counts

  stats.history[date] = {
    challengeId: result.challengeId,
    number,
    selectedIndex: result.selectedIndex,
    correctIndex: result.correctIndex,
    isCorrect: result.isCorrect,
    explanation: result.explanation,
    attackTechnique: result.attackTechnique,
  };

  if (stats.lastPlayed && dayDiff(stats.lastPlayed, date) === 1) {
    stats.currentStreak += 1;
  } else if (stats.lastPlayed !== date) {
    stats.currentStreak = 1;
  }
  stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
  stats.lastPlayed = date;

  try {
    window.localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // Storage blocked: the game still works, progress just will not persist.
  }
  listeners.forEach((cb) => cb());
  return stats;
}
