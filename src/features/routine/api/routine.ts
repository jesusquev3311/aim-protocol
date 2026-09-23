import { supabase } from "@/lib/supabase/client";
import type { RoutineValues } from "@/features/routine/schemas/routine-schema";
import type { RoutineProgramValues } from "@/features/routine/schemas/routine-program-schema";

const sessionFields = "id, user_id, routine_program_id, day_number, session_date, overaim_bots, underaim_bots, flick_bots, microflick_minutes, practice_minutes, deathmatches, ranked_matches, shooting_error_graph, stop_before_shooting, no_crouch_spray, burst_strafe, notes, started_at, completed_at, created_at, updated_at" as const;
const programFields = "id, user_id, name, start_date, duration_days, weekdays, status, completed_at, created_at" as const;

export async function getRoutinePrograms() {
  const { data, error } = await supabase.from("routine_programs").select(programFields).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getRoutineProgram(programId: string) {
  const [{ data: program, error: programError }, { data: days, error: daysError }] = await Promise.all([
    supabase.from("routine_programs").select(programFields).eq("id", programId).single(),
    supabase.from("routine_sessions").select(sessionFields).eq("routine_program_id", programId).order("day_number"),
  ]);
  if (programError) throw programError;
  if (daysError) throw daysError;
  return { program, days };
}

export async function getActiveRoutineProgram() {
  const { data: program, error } = await supabase.from("routine_programs").select(programFields).eq("status", "active").maybeSingle();
  if (error) throw error;
  if (!program) return null;
  const { data: days, error: daysError } = await supabase.from("routine_sessions").select(sessionFields).eq("routine_program_id", program.id).order("day_number");
  if (daysError) throw daysError;
  return { program, days };
}

export async function createRoutineProgram(values: RoutineProgramValues) {
  const { data, error } = await supabase.rpc("create_routine_program", { p_name: values.name, p_start_date: values.startDate, p_duration_days: values.durationDays, p_weekdays: values.weekdays });
  if (error) throw error;
  return data;
}

export async function getRoutineSessionById(sessionId: string) {
  const { data, error } = await supabase.from("routine_sessions").select(sessionFields).eq("id", sessionId).single();
  if (error) throw error;
  return data;
}

export async function getRoutineHistory(startDate: string) {
  const { data, error } = await supabase.from("routine_sessions").select(sessionFields).gte("session_date", startDate).order("session_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveRoutineSession({ sessionId, values }: { sessionId: string; values: RoutineValues }) {
  const { data, error } = await supabase.from("routine_sessions").update({
    overaim_bots: values.overaimBots,
    underaim_bots: values.underaimBots,
    flick_bots: values.flickBots,
    microflick_minutes: values.microflickMinutes,
    practice_minutes: values.practiceMinutes,
    deathmatches: values.deathmatches,
    ranked_matches: values.rankedMatches,
    shooting_error_graph: values.shootingErrorGraph,
    stop_before_shooting: values.stopBeforeShooting,
    no_crouch_spray: values.noCrouchSpray,
    burst_strafe: values.burstStrafe,
    notes: values.notes.trim() || null,
  }).eq("id", sessionId).select(sessionFields).single();
  if (error) throw error;
  return data;
}

export async function startRoutineSession(sessionId: string) {
  const { data, error } = await supabase.rpc("start_routine_session", { p_session_id: sessionId });
  if (error) throw error;
  return data;
}

export async function finishRoutineDay(sessionId: string) {
  const { data, error } = await supabase.rpc("finish_routine_day", { p_session_id: sessionId });
  if (error) throw error;
  return data;
}

export async function finishRoutineProgram(programId: string) {
  const { error } = await supabase.rpc("finish_routine_program", { p_program_id: programId });
  if (error) throw error;
}
