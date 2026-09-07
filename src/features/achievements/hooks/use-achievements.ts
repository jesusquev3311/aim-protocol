import { useQuery } from "@tanstack/react-query";
import { getChallengeAchievementProgress, getChallengeAchievements } from "@/features/achievements/api/achievements";

export function useChallengeAchievements(challengeId: string) {
  return useQuery({ queryKey: ["achievements", challengeId], queryFn: () => getChallengeAchievements(challengeId), enabled: Boolean(challengeId) });
}

export function useChallengeAchievementProgress(challengeId: string) {
  return useQuery({ queryKey: ["achievements", challengeId, "progress"], queryFn: () => getChallengeAchievementProgress(challengeId), enabled: Boolean(challengeId) });
}
