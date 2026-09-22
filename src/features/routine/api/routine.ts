import { supabase } from "@/lib/supabase/client";
import type { RoutineValues } from "@/features/routine/schemas/routine-schema";

const sessionFields = "id, user_id, session_date, overaim_bots, underaim_bots, flick_bots, microflick_minutes, practice_minutes, deathmatches, ranked_matches, shooting_error_graph, stop_before_shooting, no_crouch_spray, burst_strafe, notes, completed_at, created_at, updated_at" as const;

export async function getRoutineSession(sessionDate: string) {
  const { data, error } = await supabase.from("routine_sessions").select(sessionFields).eq("session_date", sessionDate).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRoutineHistory(startDate: string) {
  const { data, error } = await supabase.from("routine_sessions").select(sessionFields).gte("session_date", startDate).order("session_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveRoutineSession({ userId, values }: { userId: string; values: RoutineValues }) {
  const { data, error } = await supabase.from("routine_sessions").upsert({
    user_id: userId,
    session_date: values.sessionDate,
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
  }, { onConflict: "user_id,session_date" }).select(sessionFields).single();
  if (error) throw error;
  return data;
}
