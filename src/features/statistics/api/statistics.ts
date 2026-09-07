import { supabase } from "@/lib/supabase/client";

export async function getChallengeStatisticsData(challengeId: string) {
  const [daysResponse, challengeSkillsResponse] = await Promise.all([
    supabase.from("training_days").select("id, day_number, date, status, completed_at").eq("challenge_id", challengeId).order("day_number"),
    supabase.from("challenge_skills").select("skill_id").eq("challenge_id", challengeId),
  ]);
  if (daysResponse.error) throw daysResponse.error;
  if (challengeSkillsResponse.error) throw challengeSkillsResponse.error;

  const dayIds = daysResponse.data.map((day) => day.id);
  const skillIds = challengeSkillsResponse.data.map((item) => item.skill_id);
  const [matchesResponse, resultsResponse, skillsResponse] = await Promise.all([
    dayIds.length ? supabase.from("deathmatches").select("id, training_day_id, match_number, weapon, kills, deaths, rating, created_at").in("training_day_id", dayIds) : Promise.resolve({ data: [], error: null }),
    dayIds.length ? supabase.from("skill_results").select("training_day_id, skill_id, result").in("training_day_id", dayIds) : Promise.resolve({ data: [], error: null }),
    skillIds.length ? supabase.from("skills").select("id, name, slug").in("id", skillIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (matchesResponse.error) throw matchesResponse.error;
  if (resultsResponse.error) throw resultsResponse.error;
  if (skillsResponse.error) throw skillsResponse.error;
  return { days: daysResponse.data, matches: matchesResponse.data, skillResults: resultsResponse.data, skills: skillsResponse.data };
}

export async function getGlobalStatisticsData() {
  const [daysResponse, challengeSkillsResponse] = await Promise.all([
    supabase.from("training_days").select("id, day_number, date, status, completed_at").order("date").order("created_at"),
    supabase.from("challenge_skills").select("skill_id"),
  ]);
  if (daysResponse.error) throw daysResponse.error;
  if (challengeSkillsResponse.error) throw challengeSkillsResponse.error;

  const dayIds = daysResponse.data.map((day) => day.id);
  const skillIds = [...new Set(challengeSkillsResponse.data.map((item) => item.skill_id))];
  const [matchesResponse, resultsResponse, skillsResponse] = await Promise.all([
    dayIds.length ? supabase.from("deathmatches").select("id, training_day_id, match_number, weapon, kills, deaths, rating, created_at").in("training_day_id", dayIds) : Promise.resolve({ data: [], error: null }),
    dayIds.length ? supabase.from("skill_results").select("training_day_id, skill_id, result").in("training_day_id", dayIds) : Promise.resolve({ data: [], error: null }),
    skillIds.length ? supabase.from("skills").select("id, name, slug").in("id", skillIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (matchesResponse.error) throw matchesResponse.error;
  if (resultsResponse.error) throw resultsResponse.error;
  if (skillsResponse.error) throw skillsResponse.error;

  const sequentialDays = daysResponse.data.map((day, index) => ({ ...day, day_number: index + 1 }));
  return { days: sequentialDays, matches: matchesResponse.data, skillResults: resultsResponse.data, skills: skillsResponse.data };
}
