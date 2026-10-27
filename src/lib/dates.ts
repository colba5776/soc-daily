/** All "today" logic uses one timezone so streaks are consistent for everyone. */
export const APP_TIMEZONE = "America/New_York";

/** Day #1 of SOC Daily. Change this to your real launch date. */
export const LAUNCH_DATE = process.env.NEXT_PUBLIC_LAUNCH_DATE ?? "2026-10-27";

/** Returns YYYY-MM-DD for the current day in APP_TIMEZONE. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(now);
}

/** Whole days from a to b (both YYYY-MM-DD). */
export function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Challenge number shown to players, e.g. "SOC Daily #12". */
export function challengeNumber(publishDate: string): number {
  return Math.max(1, daysBetween(LAUNCH_DATE, publishDate) + 1);
}

export function formatLongDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
