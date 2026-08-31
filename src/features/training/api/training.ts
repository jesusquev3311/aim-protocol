import { supabase } from "@/lib/supabase/client";
import type { DeathmatchValues, SkillResult } from "@/features/training/schemas/deathmatch-schema";

export async function getTrainingOverview(challengeId: string) {
  const { data: days, error: daysError } = await supabase
    .from("training_days")
    .select("id, day_number, date, status, notes")
    .eq("challenge_id", challengeId)
    .order("day_number");
  if (daysError) throw daysError;

  const dayIds = days.map((day) => day.id);
  if (dayIds.length === 0) return { days, matches: [] };

  const { data: matches, error: matchesError } = await supabase
    .from("deathmatches")
    .select("id, training_day_id, kills, deaths")
    .in("training_day_id", dayIds);
  if (matchesError) throw matchesError;
  return { days, matches };
}

export async function getTrainingDay(trainingDayId: string) {
  const { data: day, error: dayError } = await supabase
    .from("training_days")
    .select("id, challenge_id, day_number, date, status, notes")
    .eq("id", trainingDayId)
    .single();
  if (dayError) throw dayError;

  const [challengeResponse, matchesResponse, challengeSkillsResponse, resultsResponse] = await Promise.all([
    supabase.from("challenges").select("id, duration_days, matches_per_day, recommended_mode").eq("id", day.challenge_id).single(),
    supabase.from("deathmatches").select("id, match_number, weapon, kills, deaths, rating, notes, created_at").eq("training_day_id", day.id).order("match_number"),
    supabase.from("challenge_skills").select("skill_id").eq("challenge_id", day.challenge_id),
    supabase.from("skill_results").select("id, skill_id, result").eq("training_day_id", day.id),
  ]);

  if (challengeResponse.error) throw challengeResponse.error;
  if (matchesResponse.error) throw matchesResponse.error;
  if (challengeSkillsResponse.error) throw challengeSkillsResponse.error;
  if (resultsResponse.error) throw resultsResponse.error;

  const skillIds = challengeSkillsResponse.data.map((item) => item.skill_id);
  const { data: skills, error: skillsError } = skillIds.length === 0
    ? { data: [], error: null }
    : await supabase.from("skills").select("id, name, slug").in("id", skillIds).order("id");
  if (skillsError) throw skillsError;

  return {
    day,
    challenge: challengeResponse.data,
    matches: matchesResponse.data,
    skills,
    skillResults: resultsResponse.data,
  };
}

export async function addDeathmatch(input: DeathmatchValues & { trainingDayId: string; matchNumber: number }) {
  const { data, error } = await supabase.from("deathmatches").insert({
    training_day_id: input.trainingDayId,
    match_number: input.matchNumber,
    weapon: input.weapon,
    kills: input.kills,
    deaths: input.deaths,
    rating: input.rating,
    notes: input.notes || null,
  }).select("id").single();
  if (error) throw error;
  return data;
}

export async function updateDeathmatch(input: DeathmatchValues & { trainingDayId: string; deathmatchId: string }) {
  const { data, error } = await supabase.from("deathmatches").update({
    weapon: input.weapon,
    kills: input.kills,
    deaths: input.deaths,
    rating: input.rating,
    notes: input.notes || null,
  }).eq("id", input.deathmatchId).eq("training_day_id", input.trainingDayId).select("id").single();
  if (error) throw error;
  return data;
}

export async function updateTrainingDayNotes({ trainingDayId, notes }: { trainingDayId: string; notes: string }) {
  const { error } = await supabase.from("training_days").update({ notes: notes.trim() || null }).eq("id", trainingDayId);
  if (error) throw error;
}

export async function saveSkillResult({ trainingDayId, skillId, result }: { trainingDayId: string; skillId: number; result: SkillResult }) {
  const { error } = await supabase.from("skill_results").upsert(
    { training_day_id: trainingDayId, skill_id: skillId, result },
    { onConflict: "training_day_id,skill_id" },
  );
  if (error) throw error;
}

export async function setTrainingDayStatus({ trainingDayId, status }: { trainingDayId: string; challengeId: string; status: "pending" | "partial" }) {
  const { data, error } = await supabase.rpc("set_training_day_status", {
    p_training_day_id: trainingDayId,
    p_status: status,
  });
  if (error) throw error;
  return data;
}
