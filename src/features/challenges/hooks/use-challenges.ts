import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createChallenge, deleteChallenge, finishChallenge, getActiveChallenge, getChallenge, getChallenges, getLatestChallenge, getSkills, resetChallenge, updateChallenge } from "@/features/challenges/api/challenges";

export const challengeKeys = {
  all: ["challenges"] as const,
  active: () => [...challengeKeys.all, "active"] as const,
  latest: () => [...challengeKeys.all, "latest"] as const,
  list: () => [...challengeKeys.all, "list"] as const,
  detail: (challengeId: string) => [...challengeKeys.all, "detail", challengeId] as const,
  skills: ["skills"] as const,
};

export function useSkills() {
  return useQuery({ queryKey: challengeKeys.skills, queryFn: getSkills, staleTime: Infinity });
}

export function useActiveChallenge() {
  return useQuery({ queryKey: challengeKeys.active(), queryFn: getActiveChallenge });
}

export function useLatestChallenge() {
  return useQuery({ queryKey: challengeKeys.latest(), queryFn: getLatestChallenge });
}

export function useChallenges() {
  return useQuery({ queryKey: challengeKeys.list(), queryFn: getChallenges });
}

export function useChallenge(challengeId: string) {
  return useQuery({ queryKey: challengeKeys.detail(challengeId), queryFn: () => getChallenge(challengeId), enabled: Boolean(challengeId) });
}

export function useCreateChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createChallenge,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: challengeKeys.all });
    },
  });
}

export function useUpdateChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateChallenge,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: challengeKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["training"] }),
      ]);
    },
  });
}

export function useDeleteChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteChallenge,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: challengeKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["training"] }),
      ]);
    },
  });
}

function useInvalidateChallengeData() {
  const queryClient = useQueryClient();
  return async () => Promise.all([
    queryClient.invalidateQueries({ queryKey: challengeKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["training"] }),
    queryClient.invalidateQueries({ queryKey: ["statistics"] }),
    queryClient.invalidateQueries({ queryKey: ["achievements"] }),
  ]);
}

export function useFinishChallenge() {
  const invalidate = useInvalidateChallengeData();
  return useMutation({ mutationFn: finishChallenge, onSuccess: invalidate });
}

export function useResetChallenge() {
  const invalidate = useInvalidateChallengeData();
  return useMutation({ mutationFn: resetChallenge, onSuccess: invalidate });
}
