export type RoutineAnalyticsSession = {
  id: string;
  routine_program_id: string | null;
  day_number: number | null;
  session_date: string | null;
  completed_at: string | null;
  flick_warmup_minutes: number;
  overaim_bots: number;
  underaim_bots: number;
  flick_bots: number;
  microflick_minutes: number;
  peek_left_repetitions: number;
  peek_right_repetitions: number;
  strafe_close_repetitions: number;
  strafe_mid_repetitions: number;
  strafe_long_repetitions: number;
  practice_minutes: number;
  deathmatches: number;
  warmup_hits: number | null;
  microflick_hits: number | null;
  deathmatch_kills: number | null;
  deathmatch_deaths: number | null;
  deathmatch_weapon?: string | null;
  perceived_difficulty: number | null;
  confidence_before: number | null;
  confidence_after: number | null;
  shooting_error_graph: boolean;
  stop_before_shooting: boolean;
  no_crouch_spray: boolean;
  burst_strafe: boolean;
};

type DrillKey = "overaim_bots" | "underaim_bots" | "flick_bots";
const drills: Array<{ key: DrillKey; name: string }> = [
  { key: "overaim_bots", name: "Overaim" },
  { key: "underaim_bots", name: "Underaim" },
  { key: "flick_bots", name: "Flick" },
];

export function buildRoutineStatistics(sessions: RoutineAnalyticsSession[], targetSessions: number) {
  const completed = sessions.filter((session) => session.completed_at && session.session_date).sort((a, b) => a.session_date!.localeCompare(b.session_date!));
  const trends = drills.map(({ key, name }) => {
    const values = completed.map((session, index) => ({ session: session.day_number ?? index + 1, date: session.session_date!, value: session[key] }));
    const baseline = average(values.slice(0, 3).map((point) => point.value));
    const recent = average(values.slice(-3).map((point) => point.value));
    return { name, values: values.map((point, index) => ({ ...point, rollingAverage: average(values.slice(Math.max(0, index - 2), index + 1).map((item) => item.value)) })), baseline, recent, changePercent: baseline ? ((recent - baseline) / baseline) * 100 : 0, best: values.length ? Math.max(...values.map((point) => point.value)) : 0 };
  });
  const combined = trends.map((trend) => trend.recent).reduce((total, value) => total + value, 0) / drills.length;
  const dates = [...new Set(completed.map((session) => session.session_date!))];
  const habitDefinitions = [
    ["Shooting Error Graph", "shooting_error_graph"],
    ["Stop before shooting", "stop_before_shooting"],
    ["No crouch spray", "no_crouch_spray"],
    ["Burst and strafe", "burst_strafe"],
  ] as const;
  const habits = habitDefinitions.map(([name, key]) => ({ name, percentage: percent(completed.filter((session) => session[key]).length, completed.length) }));
  const exercises = [
    { name: "Flick warm-up", percentage: percent(completed.filter((session) => session.flick_warmup_minutes >= 3).length, completed.length) },
    { name: "Overaim run", percentage: percent(completed.filter((session) => session.overaim_bots > 0).length, completed.length) },
    { name: "Underaim run", percentage: percent(completed.filter((session) => session.underaim_bots > 0).length, completed.length) },
    { name: "Flick run", percentage: percent(completed.filter((session) => session.flick_bots > 0).length, completed.length) },
    { name: "Microflicks", percentage: percent(completed.filter((session) => session.microflick_minutes >= 3).length, completed.length) },
    { name: "Peek + shoot", percentage: percent(completed.filter((session) => session.peek_left_repetitions >= 20 && session.peek_right_repetitions >= 20).length, completed.length) },
    { name: "A/D shooting", percentage: percent(completed.filter((session) => session.strafe_close_repetitions >= 60 && session.strafe_mid_repetitions >= 60 && session.strafe_long_repetitions >= 60).length, completed.length) },
    { name: "30-minute session", percentage: percent(completed.filter((session) => session.practice_minutes >= 30).length, completed.length) },
  ];
  const deathmatchSessions = completed.filter((session) => session.deathmatch_kills !== null && session.deathmatch_deaths !== null);
  const kills = sum(deathmatchSessions.map((session) => session.deathmatch_kills ?? 0));
  const deaths = sum(deathmatchSessions.map((session) => session.deathmatch_deaths ?? 0));
  const confidence = completed.filter((session) => session.confidence_before !== null && session.confidence_after !== null);
  const warmupResults = completed.filter((session) => session.warmup_hits !== null);
  const microflickResults = completed.filter((session) => session.microflick_hits !== null);
  const difficultyResults = completed.filter((session) => session.perceived_difficulty !== null);
  const activeWeeks = new Set(dates.map(startOfWeek));
  const insights: string[] = [];
  if (completed.length < 3) insights.push(`Complete ${3 - completed.length} more ${3 - completed.length === 1 ? "session" : "sessions"} to unlock a reliable baseline comparison.`);
  else {
    const strongest = [...trends].sort((a, b) => b.changePercent - a.changePercent)[0];
    const weakest = [...trends].sort((a, b) => a.changePercent - b.changePercent)[0];
    if (strongest && strongest.changePercent > 5) insights.push(`${strongest.name} has improved ${strongest.changePercent.toFixed(0)}% from your opening baseline.`);
    if (weakest && weakest.changePercent < -5) insights.push(`${weakest.name} is ${Math.abs(weakest.changePercent).toFixed(0)}% below your opening baseline; make it the next-session focus.`);
    else if (weakest && Math.abs(weakest.changePercent) <= 5) insights.push(`${weakest.name} is stable. Slow the drill down and prioritize clean first movement to break the plateau.`);
  }
  const weakestHabit = [...habits].sort((a, b) => a.percentage - b.percentage)[0];
  if (weakestHabit && weakestHabit.percentage < 80) insights.push(`${weakestHabit.name} is your least consistent habit at ${weakestHabit.percentage}%.`);
  return {
    completedSessions: completed.length,
    completionRate: percent(completed.length, targetSessions),
    combinedRecentScore: combined,
    currentStreak: calculateStreak(dates, true),
    longestStreak: calculateStreak(dates, false),
    averageGapDays: averageDateGap(dates),
    averageSessionsPerWeek: activeWeeks.size ? completed.length / activeWeeks.size : 0,
    averageMinutes: average(completed.map((session) => session.practice_minutes)),
    totalDeathmatches: sum(completed.map((session) => session.deathmatches)),
    routineKd: deaths === 0 ? kills : kills / deaths,
    routineKdSessions: deathmatchSessions.length,
    averageConfidenceChange: average(confidence.map((session) => (session.confidence_after ?? 0) - (session.confidence_before ?? 0))),
    averageWarmupHits: average(warmupResults.map((session) => session.warmup_hits ?? 0)),
    averageMicroflickHits: average(microflickResults.map((session) => session.microflick_hits ?? 0)),
    averageDifficulty: average(difficultyResults.map((session) => session.perceived_difficulty ?? 0)),
    warmupResultCount: warmupResults.length,
    microflickResultCount: microflickResults.length,
    trends, habits, exercises, activityDates: dates, insights: insights.slice(0, 3),
  };
}

function calculateStreak(dates: string[], current: boolean) {
  if (!dates.length) return 0;
  let best = 1; let running = 1; let currentStreak = 1;
  for (let index = 1; index < dates.length; index += 1) {
    const previous = dates[index - 1]; const date = dates[index];
    if (!previous || !date) continue;
    const gap = daysBetween(previous, date);
    running = gap <= 2 ? running + 1 : 1;
    best = Math.max(best, running);
    currentStreak = running;
  }
  return current ? currentStreak : best;
}
function averageDateGap(dates: string[]) { return dates.length < 2 ? 0 : average(dates.slice(1).map((date, index) => { const previous = dates[index]; return previous ? daysBetween(previous, date) : 0; })); }
function daysBetween(a: string, b: string) { return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000); }
function startOfWeek(date: string) { const value = new Date(`${date}T00:00:00Z`); const offset = (value.getUTCDay() + 6) % 7; value.setUTCDate(value.getUTCDate() - offset); return value.toISOString().slice(0, 10); }
function percent(value: number, total: number) { return total ? Math.round((value / total) * 100) : 0; }
function sum(values: number[]) { return values.reduce((total, value) => total + value, 0); }
function average(values: number[]) { return values.length ? sum(values) / values.length : 0; }
