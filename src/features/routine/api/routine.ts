import { supabase } from "@/lib/supabase/client";
import type { RoutineValues } from "@/features/routine/schemas/routine-schema";
import type { RoutineProgramValues } from "@/features/routine/schemas/routine-program-schema";

const sessionFields = "id, user_id, routine_program_id, day_number, session_date, flick_warmup_minutes, overaim_bots, underaim_bots, flick_bots, microflick_minutes, peek_left_repetitions, peek_right_repetitions, strafe_close_repetitions, strafe_mid_repetitions, strafe_long_repetitions, practice_minutes, deathmatches, ranked_matches, warmup_hits, microflick_hits, deathmatch_kills, deathmatch_deaths, deathmatch_weapon, perceived_difficulty, confidence_before, confidence_after, session_focus, shooting_error_graph, stop_before_shooting, no_crouch_spray, burst_strafe, notes, started_at, completed_at, created_at, updated_at" as const;
const programFields = "id, user_id, name, start_date, duration_days, weekdays, template_code, sets_per_side, status, completed_at, created_at" as const;

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
  const { data, error } = await supabase.rpc("create_routine_program", { p_name: values.name, p_start_date: values.startDate, p_duration_days: values.durationDays, p_template_code: values.templateCode, p_sets_per_side: values.templateCode === "corner_strafe_benchmark" ? values.setsPerSide : null });
  if (error) throw error;
  return data;
}

export async function getBenchmarkSets(sessionId: string) {
  const { data, error } = await supabase.from("routine_benchmark_sets").select("id, routine_session_id, side, set_number, weapon, bots_completed, duration_seconds, execution_quality, created_at, updated_at").eq("routine_session_id", sessionId).order("side").order("set_number");
  if (error) throw error;
  return data;
}

export async function saveBenchmarkSet(values: { routineSessionId: string; side: "left" | "right"; setNumber: number; weapon: "Vandal" | "Sheriff"; botsCompleted: number; durationSeconds: number | null; executionQuality: "clean" | "mixed" | "rushed" | null }) {
  const { data, error } = await supabase.from("routine_benchmark_sets").upsert({ routine_session_id: values.routineSessionId, side: values.side, set_number: values.setNumber, weapon: values.weapon, bots_completed: values.botsCompleted, duration_seconds: values.durationSeconds, execution_quality: values.executionQuality, updated_at: new Date().toISOString() }, { onConflict: "routine_session_id,side,set_number" }).select("id, routine_session_id, side, set_number, weapon, bots_completed, duration_seconds, execution_quality, created_at, updated_at").single();
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
    flick_warmup_minutes: values.flickWarmupMinutes,
    overaim_bots: values.overaimBots,
    underaim_bots: values.underaimBots,
    flick_bots: values.flickBots,
    microflick_minutes: values.microflickMinutes,
    peek_left_repetitions: values.peekLeftRepetitions,
    peek_right_repetitions: values.peekRightRepetitions,
    strafe_close_repetitions: values.strafeCloseRepetitions,
    strafe_mid_repetitions: values.strafeMidRepetitions,
    strafe_long_repetitions: values.strafeLongRepetitions,
    deathmatches: values.deathmatches,
    ranked_matches: values.rankedMatches,
    warmup_hits: values.warmupHits,
    microflick_hits: values.microflickHits,
    deathmatch_kills: values.deathmatchKills,
    deathmatch_deaths: values.deathmatchDeaths,
    deathmatch_weapon: values.deathmatchWeapon || null,
    perceived_difficulty: values.perceivedDifficulty,
    confidence_before: values.confidenceBefore,
    confidence_after: values.confidenceAfter,
    session_focus: values.sessionFocus || null,
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

export async function finishRoutineDay({ sessionId, performedOn }: { sessionId: string; performedOn: string }) {
  const { data, error } = await supabase.rpc("finish_routine_day", { p_session_id: sessionId, p_performed_on: performedOn });
  if (error) throw error;
  return data;
}

export async function finishRoutineProgram(programId: string) {
  const { error } = await supabase.rpc("finish_routine_program", { p_program_id: programId });
  if (error) throw error;
}
