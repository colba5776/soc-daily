import { Suspense } from "react";
import { connection } from "next/server";
import ReactMarkdown from "react-markdown";
import { AnswerPanel } from "@/components/AnswerPanel";
import { ArtifactViewer } from "@/components/ArtifactViewer";
import { getAnswer, getTodaysChallenge, getUserAttempt } from "@/lib/challenges";
import { formatLongDate } from "@/lib/dates";
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/lib/labels";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/supabase/server";
import type { AnswerResult } from "@/lib/types";

export default function HomePage() {
  return (
    <Suspense fallback={<ChallengeSkeleton />}>
      <TodaysChallenge />
    </Suspense>
  );
}

async function TodaysChallenge() {
  await connection(); // "today" depends on the request time, so render per request

  const challenge = await getTodaysChallenge();
  if (!challenge) return <NoChallenge />;

  const user = await getCurrentUser();

  // Signed-in player who already answered: show their result immediately.
  let initialResult: AnswerResult | null = null;
  if (user) {
    const attempt = await getUserAttempt(user.id, challenge.id);
    if (attempt) {
      const answer = await getAnswer(challenge.id);
      if (answer) {
        initialResult = {
          challengeId: challenge.id,
          selectedIndex: attempt.selected_index,
          correctIndex: answer.correctIndex,
          isCorrect: attempt.is_correct,
          explanation: answer.explanation,
          attackTechnique: answer.attackTechnique,
        };
      }
    }
  }

  return (
    <article className="space-y-7">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs text-faint">
          <span className="rounded border border-signal/40 bg-signal-dim/40 px-2 py-0.5 font-semibold text-signal">
            #{challenge.number}
          </span>
          <span>{formatLongDate(challenge.publishDate)}</span>
          <span className="text-line-strong">/</span>
          <span className="uppercase tracking-wider text-muted">{CATEGORY_LABELS[challenge.category]}</span>
          <span className="text-line-strong">/</span>
          <DifficultyMeter level={challenge.difficulty} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">{challenge.title}</h1>
        <div className="scenario max-w-2xl text-[15px] leading-relaxed text-muted">
          <ReactMarkdown>{challenge.scenario}</ReactMarkdown>
        </div>
      </header>

      <ArtifactViewer artifact={challenge.artifact} type={challenge.artifactType} />

      <AnswerPanel
        challenge={challenge}
        signedIn={Boolean(user)}
        accountsEnabled={isSupabaseConfigured}
        initialResult={initialResult}
      />

      {!isSupabaseConfigured && (
        <p className="rounded-lg border border-amber/30 bg-amber-dim/40 px-3 py-2 font-mono text-xs text-amber">
          Demo mode: challenges rotate from content/challenges.json. Add Supabase keys to .env.local to
          enable accounts and scheduled challenges.
        </p>
      )}
    </article>
  );
}

function DifficultyMeter({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="flex items-center gap-1.5" title={`Difficulty: ${DIFFICULTY_LABELS[level]}`}>
      <span className="flex gap-0.5">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-2.5 w-1.5 rounded-sm ${n <= level ? (level === 3 ? "bg-alert" : level === 2 ? "bg-amber" : "bg-signal") : "bg-line-strong"}`}
          />
        ))}
      </span>
      <span className="uppercase tracking-wider">{DIFFICULTY_LABELS[level]}</span>
    </span>
  );
}

function NoChallenge() {
  return (
    <div className="rounded-lg border border-line bg-panel p-8 text-center">
      <p className="font-mono text-sm text-amber">NO ALERTS IN QUEUE</p>
      <h1 className="mt-2 text-2xl font-semibold">No challenge scheduled for today</h1>
      <p className="mt-2 text-muted">Quiet shift. Check back tomorrow.</p>
    </div>
  );
}

function ChallengeSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading today's challenge">
      <div className="h-4 w-64 rounded bg-panel-2" />
      <div className="h-9 w-3/4 rounded bg-panel-2" />
      <div className="h-4 w-full max-w-xl rounded bg-panel-2" />
      <div className="h-56 rounded-lg border border-line bg-panel" />
      <div className="space-y-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg border border-line bg-panel" />
        ))}
      </div>
    </div>
  );
}
