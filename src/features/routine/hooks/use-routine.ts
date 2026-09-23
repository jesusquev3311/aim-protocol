import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRoutineProgram, finishRoutineDay, finishRoutineProgram, getActiveRoutineProgram, getRoutineHistory, getRoutineProgram, getRoutinePrograms, getRoutineSessionById, saveRoutineSession, startRoutineSession } from "@/features/routine/api/routine";

export const routineKeys = {
  all: ["routine"] as const,
  history: (startDate: string) => ["routine", "history", startDate] as const,
  programs: () => ["routine", "programs"] as const,
  program: (programId: string) => ["routine", "program", programId] as const,
  activeProgram: () => ["routine", "active-program"] as const,
  sessionById: (sessionId: string) => ["routine", "session-id", sessionId] as const,
};

export function useRoutinePrograms() { return useQuery({ queryKey: routineKeys.programs(), queryFn: getRoutinePrograms }); }
export function useRoutineProgram(programId: string) { return useQuery({ queryKey: routineKeys.program(programId), queryFn: () => getRoutineProgram(programId), enabled: Boolean(programId) }); }
export function useActiveRoutineProgram() { return useQuery({ queryKey: routineKeys.activeProgram(), queryFn: getActiveRoutineProgram }); }
export function useRoutineSessionById(sessionId: string) { return useQuery({ queryKey: routineKeys.sessionById(sessionId), queryFn: () => getRoutineSessionById(sessionId), enabled: Boolean(sessionId) }); }

export function useRoutineHistory(startDate: string) {
  return useQuery({ queryKey: routineKeys.history(startDate), queryFn: () => getRoutineHistory(startDate) });
}

export function useSaveRoutineSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveRoutineSession,
    onSuccess: async (session) => {
      queryClient.setQueryData(routineKeys.sessionById(session.id), session);
      await queryClient.invalidateQueries({ queryKey: routineKeys.all });
    },
  });
}

export function useCreateRoutineProgram() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: createRoutineProgram, onSuccess: async () => queryClient.invalidateQueries({ queryKey: routineKeys.all }) });
}

export function useStartRoutineSession() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: startRoutineSession, onSuccess: async () => queryClient.invalidateQueries({ queryKey: routineKeys.all }) });
}

export function useFinishRoutineDay() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: finishRoutineDay, onSuccess: async () => queryClient.invalidateQueries({ queryKey: routineKeys.all }) });
}

export function useFinishRoutineProgram() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: finishRoutineProgram, onSuccess: async () => queryClient.invalidateQueries({ queryKey: routineKeys.all }) });
}
