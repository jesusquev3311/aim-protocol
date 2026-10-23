export type BenchmarkSetResult = { side: "left" | "right"; set_number: number; weapon: "Vandal" | "Sheriff"; bots_completed: number; duration_seconds: number | null; execution_quality: "clean" | "mixed" | "rushed" | null };

export function getBenchmarkSummary(sets: BenchmarkSetResult[], setsPerSide: number) {
  const completed = sets.filter((set) => set.bots_completed === 100 && set.duration_seconds !== null);
  const timed = completed.map((set) => set.duration_seconds!).sort((a, b) => a - b);
  const left = completed.filter((set) => set.side === "left").map((set) => set.duration_seconds!);
  const right = completed.filter((set) => set.side === "right").map((set) => set.duration_seconds!);
  const vandal = completed.filter((set) => set.weapon === "Vandal").slice(-5);
  const sheriff = completed.filter((set) => set.weapon === "Sheriff").slice(-5);
  const vandalReady = vandal.length === 5 && vandal.every((set) => set.duration_seconds! <= 110 && set.execution_quality !== "rushed");
  const sheriffReady = sheriff.length === 5 && sheriff.every((set) => set.duration_seconds! <= 130 && set.execution_quality !== "rushed");
  return { completedSets: completed.length, targetSets: setsPerSide * 2, completionPercent: Math.round(completed.length / (setsPerSide * 2) * 100), averageSeconds: average(timed), medianSeconds: median(timed), bestSeconds: timed[0] ?? 0, leftMedian: median(left), rightMedian: median(right), cleanPercent: completed.length ? Math.round(completed.filter((set) => set.execution_quality === "clean").length / completed.length * 100) : 0, recommendedWeapon: vandalReady ? "Sheriff" as const : "Vandal" as const, sheriffTargetReached: sheriffReady };
}

export function median(values: number[]) { if (!values.length) return 0; const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] ?? 0 : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2; }
function average(values: number[]) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
