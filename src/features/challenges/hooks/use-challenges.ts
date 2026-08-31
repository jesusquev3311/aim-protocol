import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createChallenge, deleteChallenge, getActiveChallenge, getSkills, updateChallenge } from "@/features/challenges/api/challenges";

export const challengeKeys = {
  all: ["challenges"] as const,
  active: () => [...challengeKeys.all, "active"] as const,
  skills: ["skills"] as const,
};

export function useSkills() {
  return useQuery({ queryKey: challengeKeys.skills, queryFn: getSkills, staleTime: Infinity });
}

export function useActiveChallenge() {
  return useQuery({ queryKey: challengeKeys.active(), queryFn: getActiveChallenge });
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
