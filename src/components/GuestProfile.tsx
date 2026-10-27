"use client";

import Link from "next/link";
import { liveStreak, useGuestStats } from "@/lib/guest-stats";

function todayET() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

export function GuestProfile() {
  const stats = useGuestStats();

  if (!stats) {
    return <div className="h-32 animate-pulse rounded-lg border border-line bg-panel" />;
  }

  const days = Object.entries(stats.history).sort(([a], [b]) => (a < b ? 1 : -1));
  const played = days.length;
  const correct = days.filter(([, d]) => d.isCorrect).length;
  const accuracy = played ? Math.round((correct / played) * 100) : 0;

  if (played === 0) {
    return (
      <div className="rounded-lg border border-line bg-panel p-6">
        <p className="text-muted">No challenges played yet in this browser.</p>
        <Link href="/" className="mt-3 inline-block font-mono text-sm text-signal underline underline-offset-2">
          Play today&apos;s challenge →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Current streak" value={`${liveStreak(stats, todayET())}`} accent />
        <Tile label="Longest streak" value={`${stats.longestStreak}`} />
        <Tile label="Played" value={`${played}`} />
        <Tile label="Accuracy" value={`${accuracy}%`} />
      </div>
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel font-mono text-[11px] uppercase tracking-wider text-faint">
            <tr>
              <th className="px-3 py-2 font-normal">#</th>
              <th className="px-3 py-2 font-normal">Date</th>
              <th className="px-3 py-2 font-normal">Result</th>
              <th className="px-3 py-2 font-normal">ATT&amp;CK</th>
            </tr>
          </thead>
          <tbody>
            {days.slice(0, 30).map(([date, d]) => (
              <tr key={date} className="border-t border-line">
                <td className="px-3 py-2 font-mono text-muted">{d.number}</td>
                <td className="px-3 py-2 font-mono text-muted">{date}</td>
                <td className={`px-3 py-2 font-mono ${d.isCorrect ? "text-signal" : "text-alert"}`}>
                  {d.isCorrect ? "correct" : "missed"}
                </td>
                <td className="px-3 py-2 font-mono text-muted">{d.attackTechnique ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{label}</p>
      <p className={`mt-1 font-mono text-3xl ${accent ? "text-signal" : "text-text"}`}>{value}</p>
    </div>
  );
}
