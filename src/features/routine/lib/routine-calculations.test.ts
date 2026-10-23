import { describe, expect, it } from "vitest";
import { calculateRoutineProgress, calculateWeeklyRanked } from "@/features/routine/lib/routine-calculations";

describe("routine calculations", () => {
  it("treats bot values as scores from a 30-bot run", () => {
    const maximumResult = { flickWarmupMinutes: 3, overaimBots: 30, underaimBots: 30, flickBots: 30, microflickMinutes: 3, practiceMinutes: 30 };
    expect(calculateRoutineProgress(maximumResult)).toBe(100);
    expect(calculateRoutineProgress({ ...maximumResult, overaimBots: 15 })).toBe(92);
  });

  it("treats cleared numeric inputs as zero instead of returning NaN", () => {
    expect(calculateRoutineProgress({ flickWarmupMinutes: Number.NaN, overaimBots: Number.NaN, underaimBots: 0, flickBots: 0, microflickMinutes: 0, practiceMinutes: 0 })).toBe(0);
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
