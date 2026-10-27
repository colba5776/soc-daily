import { Suspense } from "react";
import Link from "next/link";
import { GuestProfile } from "@/components/GuestProfile";
import { getUserStats } from "@/lib/challenges";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata = { title: "Your stats · SOC Daily" };

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Your stats</h1>
      <Suspense fallback={<div className="h-32 animate-pulse rounded-lg border border-line bg-panel" />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}

async function ProfileContent() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="space-y-5">
        <GuestProfile />
        {isSupabaseConfigured && (
          <p className="text-sm text-muted">
            These stats live in this browser.{" "}
            <Link href="/login" className="text-signal underline underline-offset-2">
              Sign in
            </Link>{" "}
            to save your streak across devices.
          </p>
        )}
      </div>
    );
  }

  const stats = await getUserStats(user.id);
  const accuracy = stats.played ? Math.round((stats.correct / stats.played) * 100) : 0;

  return (
    <div className="space-y-5">
      <p className="font-mono text-sm text-muted">
        Signed in as <span className="text-text">{stats.username ?? user.email}</span>
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Current streak" value={`${stats.currentStreak}`} accent />
        <Tile label="Longest streak" value={`${stats.longestStreak}`} />
        <Tile label="Played" value={`${stats.played}`} />
        <Tile label="Accuracy" value={`${accuracy}%`} />
      </div>
      <form action="/auth/signout" method="post">
        <button className="rounded-md border border-line-strong px-3 py-1.5 text-sm text-muted hover:border-alert hover:text-alert">
          Sign out
        </button>
      </form>
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
