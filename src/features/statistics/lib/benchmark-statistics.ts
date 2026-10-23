import { median } from "@/features/routine/lib/benchmark-calculations";

type SetResult = { routine_session_id: string; side: "left" | "right"; set_number: number; weapon: "Vandal" | "Sheriff"; bots_completed: number; duration_seconds: number | null; execution_quality: "clean" | "mixed" | "rushed" | null };

export function buildBenchmarkStatistics(sets: SetResult[]) {
  const completed = sets.filter((set) => set.bots_completed === 100 && set.duration_seconds !== null);
  const times = completed.map((set) => set.duration_seconds!);
  const opening = median(times.slice(0, 5)); const recent = median(times.slice(-5));
  const left = median(completed.filter((set) => set.side === "left").map((set) => set.duration_seconds!));
  const right = median(completed.filter((set) => set.side === "right").map((set) => set.duration_seconds!));
  const bySession = new Map<string, number[]>(); for (const set of completed) bySession.set(set.routine_session_id, [...(bySession.get(set.routine_session_id) ?? []), set.duration_seconds!]);
  const trend = [...bySession].map(([sessionId, values], index) => ({ sessionId, session: index + 1, medianSeconds: median(values) }));
  const weaponStats = (["Vandal", "Sheriff"] as const).map((weapon) => { const values = completed.filter((set) => set.weapon === weapon).map((set) => set.duration_seconds!); return { weapon, sets: values.length, medianSeconds: median(values) }; }).filter((weapon) => weapon.sets > 0);
  const insights: string[] = [];
  if (completed.length < 5) insights.push(`Record ${5 - completed.length} more complete sets to establish a timing baseline.`);
  else if (recent < opening) insights.push(`Your recent five-set median is ${(opening - recent).toFixed(1)} seconds faster than your opening baseline.`);
  else if (recent > opening) insights.push(`Your recent median is ${(recent - opening).toFixed(1)} seconds slower. Prioritize clean execution and recovery.`);
  if (left && right && Math.abs(left - right) >= 3) insights.push(`${left > right ? "Left" : "Right"}-corner sets are ${Math.abs(left - right).toFixed(1)} seconds slower on median.`);
  const cleanPercent = completed.length ? Math.round(completed.filter((set) => set.execution_quality === "clean").length / completed.length * 100) : 0;
  return { completedSets: completed.length, medianSeconds: median(times), bestSeconds: times.length ? Math.min(...times) : 0, openingMedian: opening, recentMedian: recent, improvementSeconds: opening && recent ? opening - recent : 0, leftMedian: left, rightMedian: right, cleanPercent, trend, weaponStats, insights };
}
