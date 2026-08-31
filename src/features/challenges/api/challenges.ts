import { supabase } from "@/lib/supabase/client";
import type { CreateChallengeValues } from "@/features/challenges/schemas/challenge-schema";
import type { ChallengeSettingsValues } from "@/features/challenges/schemas/challenge-settings-schema";

export async function getSkills() {
  const { data, error } = await supabase.from("skills").select("id, slug, name").order("id");
  if (error) throw error;
  return data;
}

export async function getActiveChallenge() {
  const { data, error } = await supabase
    .from("challenges")
    .select("id, duration_days, matches_per_day, start_date, status, recommended_mode, created_at")
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createChallenge(values: CreateChallengeValues) {
  const { data, error } = await supabase.rpc("create_challenge", {
    p_duration_days: values.durationDays,
    p_matches_per_day: values.matchesPerDay,
    p_start_date: values.startDate,
    p_recommended_mode: values.recommendedMode,
    p_skill_ids: values.skillIds,
  });
  if (error) throw error;
  return data;
}

export async function updateChallenge({ challengeId, values }: { challengeId: string; values: ChallengeSettingsValues }) {
  const { data, error } = await supabase
    .from("challenges")
    .update({ start_date: values.startDate })
    .eq("id", challengeId)
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteChallenge(challengeId: string) {
  const { error } = await supabase.from("challenges").delete().eq("id", challengeId);
  if (error) throw error;
}
