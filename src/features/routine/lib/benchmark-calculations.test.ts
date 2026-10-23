import { describe, expect, it } from "vitest";
import { getBenchmarkSummary, type BenchmarkSetResult } from "@/features/routine/lib/benchmark-calculations";

const result = (set: number, seconds: number, side: "left" | "right" = "left"): BenchmarkSetResult => ({ side, set_number: set, weapon: "Vandal", bots_completed: 100, duration_seconds: seconds, execution_quality: "clean" });

describe("corner strafe benchmark", () => {
  it("uses medians and recommends Sheriff after five controlled Vandal sets at 110 seconds or faster", () => {
    const summary = getBenchmarkSummary([result(1, 110), result(2, 106), result(3, 108), result(4, 102), result(5, 100)], 5);
    expect(summary.medianSeconds).toBe(106);
    expect(summary.recommendedWeapon).toBe("Sheriff");
    expect(summary.completionPercent).toBe(50);
  });
  it("does not advance a rushed set", () => {
    const sets = [result(1, 100), result(2, 100), result(3, 100), result(4, 100), { ...result(5, 100), execution_quality: "rushed" as const }];
    expect(getBenchmarkSummary(sets, 5).recommendedWeapon).toBe("Vandal");
  });
});
