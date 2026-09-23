import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { finishRoutineSession, getRoutineHistory, getRoutineSession, saveRoutineSession } from "@/features/routine/api/routine";

export const routineKeys = {
  all: ["routine"] as const,
  session: (date: string) => ["routine", "session", date] as const,
  history: (startDate: string) => ["routine", "history", startDate] as const,
};

export function useRoutineSession(date: string) {
  return useQuery({ queryKey: routineKeys.session(date), queryFn: () => getRoutineSession(date), enabled: Boolean(date) });
}

export function useRoutineHistory(startDate: string) {
  return useQuery({ queryKey: routineKeys.history(startDate), queryFn: () => getRoutineHistory(startDate) });
}

export function useSaveRoutineSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveRoutineSession,
    onSuccess: async (session) => {
      queryClient.setQueryData(routineKeys.session(session.session_date), session);
      await queryClient.invalidateQueries({ queryKey: routineKeys.all });
    },
  });
}

export function useFinishRoutineSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: finishRoutineSession,
    onSuccess: async (_completedAt, sessionDate) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: routineKeys.session(sessionDate) }),
        queryClient.invalidateQueries({ queryKey: routineKeys.all }),
      ]);
    },
  });
}
