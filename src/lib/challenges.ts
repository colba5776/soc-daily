import "server-only";
import rawChallenges from "../../content/challenges.json";
import { challengeNumber, daysBetween, LAUNCH_DATE, todayISO } from "./dates";
import { isSupabaseConfigured } from "./supabase/config";
import { createAdminClient, createUserClient } from "./supabase/server";
import type {
  ArtifactType,
  Category,
  ChallengeAnswer,
  PublicChallenge,
} from "./types";

interface ContentChallenge {
  slug: string;
  title: string;
  category: string;
  difficulty: number;
  scenario: string;
  artifact: string;
  artifact_type: string;
  question: string;
  choices: string[];
  correct_index: number;
  explanation: string;
  attack_technique?: string;
}

const content = rawChallenges as ContentChallenge[];

interface ChallengeRow {
  id: string;
  publish_date: string;
  title: string;
  category: string;
  difficulty: number;
  scenario: string;
  artifact: string;
  artifact_type: string;
  question: string;
  choices: string[];
}

function fromRow(row: ChallengeRow): PublicChallenge {
  return {
    id: row.id,
    number: challengeNumber(row.publish_date),
    publishDate: row.publish_date,
    title: row.title,
    category: row.category as Category,
    difficulty: row.difficulty as 1 | 2 | 3,
    scenario: row.scenario,
    artifact: row.artifact,
    artifactType: row.artifact_type as ArtifactType,
    question: row.question,
    choices: row.choices,
  };
}

// ---------- Demo mode (no Supabase): rotate through content/challenges.json ----------

function demoChallengeFor(date: string): ContentChallenge {
  const n = content.length;
  const offset = daysBetween(LAUNCH_DATE, date);
  return content[((offset % n) + n) % n];
}

function demoToPublic(c: ContentChallenge, date: string): PublicChallenge {
  return fromRow({
    id: c.slug,
    publish_date: date,
    title: c.title,
    category: c.category,
    difficulty: c.difficulty,
    scenario: c.scenario,
    artifact: c.artifact,
    artifact_type: c.artifact_type,
    question: c.question,
    choices: c.choices,
  });
}

// ---------- Public API ----------

/** Today's challenge without the answer, or null if none is scheduled. */
export async function getTodaysChallenge(): Promise<PublicChallenge | null> {
  const today = todayISO();

  if (!isSupabaseConfigured) {
    return demoToPublic(demoChallengeFor(today), today);
  }

  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("challenges")
    .select(
      "id, publish_date, title, category, difficulty, scenario, artifact, artifact_type, question, choices",
    )
    .eq("publish_date", today)
    .maybeSingle<ChallengeRow>();

  if (error) {
    console.error("Failed to load today's challenge:", error.message);
    return null;
  }
  return data ? fromRow(data) : null;
}

/**
 * Looks up the answer for a challenge. Returns null if the challenge does not exist
 * or is not published yet, so nobody can fetch answers to future challenges.
 */
export async function getAnswer(challengeId: string): Promise<ChallengeAnswer | null> {
  const today = todayISO();

  if (!isSupabaseConfigured) {
    const c = demoChallengeFor(today);
    if (c.slug !== challengeId) return null;
    return {
      correctIndex: c.correct_index,
      explanation: c.explanation,
      attackTechnique: c.attack_technique ?? null,
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("challenge_answers")
    .select("correct_index, explanation, attack_technique, challenges!inner(publish_date)")
    .eq("challenge_id", challengeId)
    .lte("challenges.publish_date", today)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Failed to load answer:", error.message);
    return null;
  }
  return {
    correctIndex: data.correct_index,
    explanation: data.explanation,
    attackTechnique: data.attack_technique,
  };
}

/** The signed-in user's attempt on a challenge, if any. */
export async function getUserAttempt(userId: string, challengeId: string) {
  const supabase = await createUserClient();
  const { data } = await supabase
    .from("attempts")
    .select("selected_index, is_correct")
    .eq("user_id", userId)
    .eq("challenge_id", challengeId)
    .maybeSingle<{ selected_index: number; is_correct: boolean }>();
  return data;
}

/** Streaks and accuracy for the profile page. */
export async function getUserStats(userId: string) {
  const supabase = await createUserClient();
  const [{ data: profile }, { count: played }, { count: correct }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, current_streak, longest_streak, last_played_date")
      .eq("id", userId)
      .maybeSingle<{
        username: string | null;
        current_streak: number;
        longest_streak: number;
        last_played_date: string | null;
      }>(),
    supabase.from("attempts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_correct", true),
  ]);

  // A streak only counts if the user played today or yesterday.
  const today = todayISO();
  const last = profile?.last_played_date;
  const alive = last ? daysBetween(last, today) <= 1 : false;

  return {
    username: profile?.username ?? null,
    currentStreak: alive ? (profile?.current_streak ?? 0) : 0,
    longestStreak: profile?.longest_streak ?? 0,
    played: played ?? 0,
    correct: correct ?? 0,
  };
}
