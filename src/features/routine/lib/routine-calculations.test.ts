import { describe, expect, it } from "vitest";
import { calculateRoutineProgress, calculateWeeklyRanked, isRoutineComplete } from "@/features/routine/lib/routine-calculations";

describe("routine calculations", () => {
  it("completes the routine only after every drill and thirty minutes", () => {
    const complete = { overaimBots: 30, underaimBots: 30, flickBots: 30, microflickMinutes: 3, practiceMinutes: 30 };
    expect(isRoutineComplete(complete)).toBe(true);
    expect(calculateRoutineProgress(complete)).toBe(100);
    expect(isRoutineComplete({ ...complete, practiceMinutes: 29 })).toBe(false);
  });

  it("counts ranked matches only inside the selected calendar week", () => {
    const sessions = [
      { session_date: "2026-09-21", ranked_matches: 2, completed_at: null },
      { session_date: "2026-09-27", ranked_matches: 3, completed_at: null },
      { session_date: "2026-09-28", ranked_matches: 5, completed_at: null },
    ];
    expect(calculateWeeklyRanked(sessions, "2026-09-22")).toBe(5);
  });
});
