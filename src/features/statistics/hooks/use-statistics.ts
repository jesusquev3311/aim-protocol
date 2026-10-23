import { useQuery } from "@tanstack/react-query";
import { getBenchmarkStatisticsData, getChallengeStatisticsData, getGlobalStatisticsData, getRoutineStatisticsData } from "@/features/statistics/api/statistics";
import { buildBenchmarkStatistics } from "@/features/statistics/lib/benchmark-statistics";
import { buildChallengeStatistics } from "@/features/statistics/lib/statistics-calculations";
import { buildRoutineStatistics } from "@/features/statistics/lib/routine-statistics";

export const statisticsKeys = { all: ["statistics"] as const, global: () => ["statistics", "global"] as const, detail: (challengeId: string) => ["statistics", "challenge", challengeId] as const, routines: (programId?: string) => ["statistics", "routines", programId ?? "all"] as const };

export function useGlobalStatistics() {
  return useQuery({ queryKey: statisticsKeys.global(), queryFn: async () => buildChallengeStatistics(await getGlobalStatisticsData()) });
}

export function useChallengeStatistics(challengeId: string) {
  return useQuery({ queryKey: statisticsKeys.detail(challengeId), queryFn: async () => buildChallengeStatistics(await getChallengeStatisticsData(challengeId)), enabled: Boolean(challengeId) });
}

export function useRoutineStatistics(programId?: string) {
  return useQuery({ queryKey: statisticsKeys.routines(programId), queryFn: async () => { const data = await getRoutineStatisticsData(programId); return { ...data, statistics: buildRoutineStatistics(data.sessions, programId ? (data.programs[0]?.duration_days ?? 0) : data.sessions.length) }; } });
}

export function useBenchmarkStatistics(programId: string) {
  return useQuery({ queryKey: ["statistics", "benchmark", programId], queryFn: async () => buildBenchmarkStatistics(await getBenchmarkStatisticsData(programId)), enabled: Boolean(programId) });
}
