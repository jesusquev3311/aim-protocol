import { describe, expect, it } from "vitest";
import { buildBenchmarkStatistics } from "@/features/statistics/lib/benchmark-statistics";

describe("benchmark statistics", () => {
  it("treats lower recent times as improvement and compares corners", () => {
    const sets = Array.from({ length: 10 }, (_, index) => ({ routine_session_id: index < 5 ? "one" : "two", side: index % 2 ? "right" as const : "left" as const, set_number: index % 5 + 1, weapon: "Vandal" as const, bots_completed: 100, duration_seconds: index < 5 ? 120 : 105, execution_quality: "clean" as const }));
    const result = buildBenchmarkStatistics(sets);
    expect(result.improvementSeconds).toBe(15);
    expect(result.cleanPercent).toBe(100);
    expect(result.insights[0]).toContain("faster");
  });
});
