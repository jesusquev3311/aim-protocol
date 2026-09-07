import { useQuery } from "@tanstack/react-query";
import { getChallengeStatisticsData, getGlobalStatisticsData } from "@/features/statistics/api/statistics";
import { buildChallengeStatistics } from "@/features/statistics/lib/statistics-calculations";

export const statisticsKeys = { all: ["statistics"] as const, global: () => ["statistics", "global"] as const, detail: (challengeId: string) => ["statistics", "challenge", challengeId] as const };

export function useGlobalStatistics() {
  return useQuery({ queryKey: statisticsKeys.global(), queryFn: async () => buildChallengeStatistics(await getGlobalStatisticsData()) });
}

export function useChallengeStatistics(challengeId: string) {
  return useQuery({ queryKey: statisticsKeys.detail(challengeId), queryFn: async () => buildChallengeStatistics(await getChallengeStatisticsData(challengeId)), enabled: Boolean(challengeId) });
}
