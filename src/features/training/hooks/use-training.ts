import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDeathmatch, getTrainingDay, getTrainingOverview, saveSkillResult, setTrainingDayStatus, updateDeathmatch, updateTrainingDayNotes } from "@/features/training/api/training";

export const trainingKeys = {
  all: ["training"] as const,
  overview: (challengeId: string) => [...trainingKeys.all, "overview", challengeId] as const,
  day: (trainingDayId: string) => [...trainingKeys.all, "day", trainingDayId] as const,
};

export function useTrainingOverview(challengeId: string) {
  return useQuery({ queryKey: trainingKeys.overview(challengeId), queryFn: () => getTrainingOverview(challengeId) });
}

export function useTrainingDay(trainingDayId: string) {
  return useQuery({ queryKey: trainingKeys.day(trainingDayId), queryFn: () => getTrainingDay(trainingDayId), enabled: Boolean(trainingDayId) });
}

export function useAddDeathmatch(trainingDayId: string, challengeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addDeathmatch,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trainingKeys.day(trainingDayId) }),
        queryClient.invalidateQueries({ queryKey: trainingKeys.overview(challengeId) }),
      ]);
    },
  });
}

export function useUpdateDeathmatch(trainingDayId: string, challengeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDeathmatch,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trainingKeys.day(trainingDayId) }),
        queryClient.invalidateQueries({ queryKey: trainingKeys.overview(challengeId) }),
      ]);
    },
  });
}

export function useUpdateTrainingDayNotes(trainingDayId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTrainingDayNotes,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: trainingKeys.day(trainingDayId) }),
  });
}

export function useSaveSkillResult(trainingDayId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveSkillResult,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: trainingKeys.day(trainingDayId) }),
  });
}

export function useSetTrainingDayStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setTrainingDayStatus,
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trainingKeys.day(variables.trainingDayId) }),
        queryClient.invalidateQueries({ queryKey: trainingKeys.overview(variables.challengeId) }),
      ]);
    },
  });
}
