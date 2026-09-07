import { describe, expect, it } from "vitest";
import { buildChallengeStatistics } from "@/features/statistics/lib/statistics-calculations";

describe("buildChallengeStatistics", () => {
  it("uses aggregate kills and deaths for K/D and separates completion from volume", () => {
    const result = buildChallengeStatistics({
      days: [
        { id: "day-1", day_number: 1, status: "completed", completed_at: "2026-09-01T10:00:00Z" },
        { id: "day-2", day_number: 2, status: "pending", completed_at: null },
      ],
      matches: [
        { training_day_id: "day-1", weapon: "Vandal", kills: 20, deaths: 10 },
        { training_day_id: "day-2", weapon: "Guardian", kills: 10, deaths: 10 },
      ],
      skills: [],
      skillResults: [],
    });
    expect(result.overallKd).toBe(1.5);
    expect(result.totalMatches).toBe(2);
    expect(result.completedDays).toBe(1);
  });

  it("identifies weapon strength and the lowest self-evaluated skill", () => {
    const result = buildChallengeStatistics({
      days: [{ id: "day-1", day_number: 1, status: "completed", completed_at: "2026-09-01T10:00:00Z" }],
      matches: [
        { training_day_id: "day-1", weapon: "Sheriff", kills: 20, deaths: 5 },
        { training_day_id: "day-1", weapon: "Vandal", kills: 10, deaths: 10 },
      ],
      skills: [{ id: 1, name: "Crosshair placement" }, { id: 2, name: "Movement" }],
      skillResults: [{ skill_id: 1, result: "good" }, { skill_id: 2, result: "poor" }],
    });
    expect(result.weaponScores[0]?.name).toBe("Sheriff");
    expect(result.insights).toContain("Movement is your clearest improvement area based on self-evaluations.");
  });
});
