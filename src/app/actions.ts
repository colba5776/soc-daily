"use server";

import { getAnswer } from "@/lib/challenges";
import { todayISO } from "@/lib/dates";
import { createAdminClient, getCurrentUser } from "@/lib/supabase/server";
import type { SubmitResponse } from "@/lib/types";

/**
 * Checks an answer on the server so the correct answer never reaches the browser
 * until after the player commits. Signed-in players get the attempt saved and
 * their streak updated in the database.
 */
export async function submitAnswer(
  challengeId: string,
  selectedIndex: number,
): Promise<SubmitResponse> {
  if (typeof challengeId !== "string" || challengeId.length > 100) {
    return { ok: false, error: "Invalid challenge." };
  }
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 5) {
    return { ok: false, error: "Invalid answer choice." };
  }

  const answer = await getAnswer(challengeId);
  if (!answer) {
    return { ok: false, error: "That challenge is not available." };
  }

  const isCorrect = selectedIndex === answer.correctIndex;
  const result = {
    challengeId,
    selectedIndex,
    correctIndex: answer.correctIndex,
    isCorrect,
    explanation: answer.explanation,
    attackTechnique: answer.attackTechnique,
  };

  const user = await getCurrentUser();
  if (!user) {
    return { ok: true, result };
  }

  // Signed in: record the attempt. The first answer counts; replays return the original.
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("record_attempt", {
    p_user_id: user.id,
    p_challenge_id: challengeId,
    p_selected_index: selectedIndex,
    p_is_correct: isCorrect,
    p_today: todayISO(),
  });

  if (error) {
    console.error("record_attempt failed:", error.message);
    return { ok: true, result };
  }

  const row = Array.isArray(data) ? data[0] : data;

  // If they already answered (another tab, refresh), report their original answer.
  if (row?.already_played) {
    const { data: prior } = await admin
      .from("attempts")
      .select("selected_index, is_correct")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId)
      .maybeSingle();
    if (prior) {
      result.selectedIndex = prior.selected_index;
      result.isCorrect = prior.is_correct;
    }
  }

  return {
    ok: true,
    result: {
      ...result,
      streak: row ? { current: row.current_streak, longest: row.longest_streak } : undefined,
    },
  };
}
