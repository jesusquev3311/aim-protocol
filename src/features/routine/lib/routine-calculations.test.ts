import { describe, expect, it } from "vitest";
import { calculateRoutineProgress, calculateWeeklyRanked } from "@/features/routine/lib/routine-calculations";

describe("routine calculations", () => {
  it("treats bot values as scores from a 30-bot run", () => {
    const maximumResult = { overaimBots: 30, underaimBots: 30, flickBots: 30, microflickMinutes: 3, practiceMinutes: 30 };
    expect(calculateRoutineProgress(maximumResult)).toBe(100);
    expect(calculateRoutineProgress({ ...maximumResult, overaimBots: 15 })).toBe(90);
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
