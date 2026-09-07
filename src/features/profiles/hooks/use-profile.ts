import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changeAccountPassword, getProfile, updateAccountEmail, updateUsername } from "@/features/profiles/api/profile";

export const profileKeys = { all: ["profiles"] as const, detail: (userId: string) => ["profiles", userId] as const };

export function useProfile(userId: string) {
  return useQuery({ queryKey: profileKeys.detail(userId), queryFn: () => getProfile(userId), enabled: Boolean(userId) });
}

export function useUpdateUsername() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: updateUsername, onSuccess: (profile) => queryClient.setQueryData(profileKeys.detail(profile.id), profile) });
}

export function useUpdateAccountEmail() {
  return useMutation({ mutationFn: updateAccountEmail });
}

export function useChangeAccountPassword() {
  return useMutation({ mutationFn: changeAccountPassword });
}
