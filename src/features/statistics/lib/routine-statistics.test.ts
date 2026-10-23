import { describe, expect, it } from "vitest";
import { buildRoutineStatistics, type RoutineAnalyticsSession } from "@/features/statistics/lib/routine-statistics";

const session = (day: number, score: number): RoutineAnalyticsSession => ({
  id: String(day), routine_program_id: "program", day_number: day, session_date: `2026-10-${String(day).padStart(2, "0")}`,
  completed_at: `2026-10-${String(day).padStart(2, "0")}T12:00:00Z`, flick_warmup_minutes: 3, overaim_bots: score,
  underaim_bots: score, flick_bots: score, microflick_minutes: 3, practice_minutes: 30, deathmatches: 1,
  peek_left_repetitions: 20, peek_right_repetitions: 20, strafe_close_repetitions: 60, strafe_mid_repetitions: 60, strafe_long_repetitions: 60,
  warmup_hits: null, microflick_hits: null, deathmatch_kills: 20, deathmatch_deaths: 10, perceived_difficulty: 3,
  confidence_before: 2, confidence_after: 4, shooting_error_graph: true, stop_before_shooting: true, no_crouch_spray: true, burst_strafe: true,
});

describe("buildRoutineStatistics", () => {
  it("compares the first and latest three completed sessions", () => {
    const result = buildRoutineStatistics([session(1, 15), session(2, 15), session(3, 15), session(4, 24), session(5, 24), session(6, 24)], 6);
    expect(result.trends[0]?.baseline).toBe(15);
    expect(result.trends[0]?.recent).toBe(24);
    expect(result.trends[0]?.changePercent).toBe(60);
    expect(result.completionRate).toBe(100);
    expect(result.routineKd).toBe(2);
  });

  it("does not create improvement claims without three sessions", () => {
    const result = buildRoutineStatistics([session(1, 20)], 7);
    expect(result.insights[0]).toContain("2 more sessions");
  });
});
