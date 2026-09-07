import { supabase } from "@/lib/supabase/client";

export async function getChallengeAchievements(challengeId: string) {
  const { data: unlocks, error: unlocksError } = await supabase.from("challenge_achievements").select("achievement_id, unlocked_at").eq("challenge_id", challengeId).order("unlocked_at");
  if (unlocksError) throw unlocksError;
  const ids = unlocks.map((unlock) => unlock.achievement_id);
  if (!ids.length) return [];
  const { data: achievements, error } = await supabase.from("achievements").select("id, code, name, description, icon").in("id", ids);
  if (error) throw error;
  const byId = new Map(achievements.map((achievement) => [achievement.id, achievement]));
  return unlocks.flatMap((unlock) => {
    const achievement = byId.get(unlock.achievement_id);
    return achievement ? [{ ...achievement, unlockedAt: unlock.unlocked_at }] : [];
  });
}

export async function getChallengeAchievementProgress(challengeId: string) {
  const [achievementsResponse, unlocksResponse] = await Promise.all([
    supabase.from("achievements").select("id, code, name, description, icon").order("id"),
    supabase.from("challenge_achievements").select("achievement_id, unlocked_at").eq("challenge_id", challengeId),
  ]);
  if (achievementsResponse.error) throw achievementsResponse.error;
  if (unlocksResponse.error) throw unlocksResponse.error;
  const unlockedAt = new Map(unlocksResponse.data.map((unlock) => [unlock.achievement_id, unlock.unlocked_at]));
  return achievementsResponse.data.map((achievement) => ({ ...achievement, unlockedAt: unlockedAt.get(achievement.id) ?? null }));
}
