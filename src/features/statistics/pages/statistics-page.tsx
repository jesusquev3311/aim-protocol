import { BarChart3, Crosshair, Gamepad2, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalStatistics, useRoutineStatistics } from "@/features/statistics/hooks/use-statistics";
import { buildRoutineStatistics } from "@/features/statistics/lib/routine-statistics";
import { RoutineStatisticsContent } from "@/features/statistics/pages/routine-statistics-content";

export function StatisticsPage() {
  const query = useGlobalStatistics();
  if (query.isPending) return <p className="text-sm text-muted-foreground">Analyzing your training…</p>;
  if (query.isError) return <p role="alert" className="text-sm text-red-400">Could not load analytics.</p>;
  return <div className="space-y-12"><StatisticsContent stats={query.data} title="Global performance" description="Trends across all of your challenges, matches, and skill evaluations." /><GlobalRoutineAnalytics challengeDays={query.data.dayScores} /></div>;
}

function GlobalRoutineAnalytics({ challengeDays }: { challengeDays: StatisticsResult["dayScores"] }) {
  const query = useRoutineStatistics();
  const [programId, setProgramId] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const filtered = useMemo(() => {
    if (!query.data) return [];
    const mechanicsPrograms = new Set(query.data.programs.filter((program) => program.template_code === "mechanics_protocol").map((program) => program.id));
    return query.data.sessions.filter((session) => mechanicsPrograms.has(session.routine_program_id ?? "") && (programId === "all" || session.routine_program_id === programId) && (!fromDate || (session.session_date ?? "") >= fromDate) && (!toDate || (session.session_date ?? "") <= toDate));
  }, [fromDate, programId, query.data, toDate]);
  if (query.isPending) return <p className="text-sm text-muted-foreground">Analyzing routine history…</p>;
  if (query.isError) return <p role="alert" className="text-sm text-red-400">Could not load routine analytics.</p>;
  const mechanicsPrograms = query.data.programs.filter((program) => program.template_code === "mechanics_protocol");
  const target = programId === "all" ? mechanicsPrograms.reduce((total, program) => total + program.duration_days, 0) : mechanicsPrograms.find((program) => program.id === programId)?.duration_days ?? filtered.length;
  const statistics = buildRoutineStatistics(filtered, target);
  const routineDates = new Set(statistics.activityDates);
  const routineDayKd = challengeDays.filter((day) => day.completedAt && routineDates.has(day.completedAt.slice(0, 10))).map((day) => day.averageKd);
  const otherDayKd = challengeDays.filter((day) => day.completedAt && !routineDates.has(day.completedAt.slice(0, 10))).map((day) => day.averageKd);
  const routineAverage = average(routineDayKd); const otherAverage = average(otherDayKd);
  return <section className="space-y-6 border-t pt-10"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Routine analytics</p><h2 className="mt-2 text-3xl font-bold">Training consistency and mechanics</h2><p className="mt-2 text-muted-foreground">Filter across Routine Programs and actual completion dates.</p></div><div className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-3"><label className="space-y-2 text-sm"><span className="font-medium">Routine Program</span><select value={programId} onChange={(event) => setProgramId(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3"><option value="all">All programs</option>{query.data.programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label><label className="space-y-2 text-sm"><span className="font-medium">From</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3" /></label><label className="space-y-2 text-sm"><span className="font-medium">To</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3" /></label></div>{routineDayKd.length > 0 && otherDayKd.length > 0 && <Card className="border-primary/30"><CardHeader><CardTitle>Routine and Deathmatch association</CardTitle><CardDescription>This is an observed association, not proof that the routine caused the result.</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold">{routineAverage.toFixed(2)} K/D on routine days</p><p className="mt-2 text-sm text-muted-foreground">Compared with {otherAverage.toFixed(2)} K/D on other recorded training days across {routineDayKd.length + otherDayKd.length} days.</p></CardContent></Card>}<RoutineStatisticsContent statistics={statistics} /></section>;
}

function average(values: number[]) { return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0; }

export type StatisticsResult = NonNullable<ReturnType<typeof useGlobalStatistics>["data"]>;

export function StatisticsContent({ stats, title, description }: { stats: StatisticsResult; title: string; description: string }) {
  return <section className="space-y-8"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Analytics</p><h1 className="mt-2 text-3xl font-bold">{title}</h1><p className="mt-2 text-muted-foreground">{description}</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={<Gamepad2 />} label="Deathmatches" value={String(stats.totalMatches)} /><Metric icon={<Crosshair />} label="Overall K/D" value={stats.overallKd.toFixed(2)} /><Metric icon={<TrendingUp />} label="Recent trend" value={`${stats.improvementPercent >= 0 ? "+" : ""}${stats.improvementPercent.toFixed(0)}%`} /><Metric icon={<BarChart3 />} label="Completed days" value={String(stats.completedDays)} /></div>
    <Card><CardHeader><CardTitle>K/D trend by training day</CardTitle><CardDescription>Combined kills divided by deaths for each day with recorded matches.</CardDescription></CardHeader><CardContent>{stats.dayScores.length ? <TrendChart points={stats.dayScores} /> : <Empty />}</CardContent></Card>
    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Weapon performance</CardTitle><CardDescription>Compare K/D while accounting for match volume.</CardDescription></CardHeader><CardContent className="space-y-4">{stats.weaponScores.length ? stats.weaponScores.map((weapon) => <ScoreBar key={weapon.name} label={weapon.name} score={weapon.averageKd} detail={`${weapon.matches} matches`} max={Math.max(...stats.weaponScores.map((item) => item.averageKd), 1)} />) : <Empty />}</CardContent></Card><Card><CardHeader><CardTitle>Skill self-evaluations</CardTitle><CardDescription>Average score from poor (1) to good (3).</CardDescription></CardHeader><CardContent className="space-y-4">{stats.skillScores.length ? stats.skillScores.map((skill) => <ScoreBar key={skill.name} label={skill.name} score={skill.score} detail={`${skill.evaluations} evaluations`} max={3} />) : <Empty />}</CardContent></Card></div>
    <Card className="border-primary/30"><CardHeader><CardTitle>Training insights</CardTitle><CardDescription>Use these signals to plan your next focused sessions.</CardDescription></CardHeader><CardContent><ul className="space-y-3">{stats.insights.map((insight) => <li key={insight} className="rounded-md bg-muted/50 p-4 text-sm">{insight}</li>)}</ul></CardContent></Card>
  </section>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-5 w-5 text-primary">{icon}</span>{label}</div><p className="mt-3 text-2xl font-bold">{value}</p></CardContent></Card>; }
function ScoreBar({ label, score, detail, max }: { label: string; score: number; detail: string; max: number }) { return <div><div className="mb-2 flex justify-between gap-3 text-sm"><span className="font-medium">{label}</span><span className="text-muted-foreground">{score.toFixed(2)} · {detail}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (score / max) * 100)}%` }} /></div></div>; }
function Empty() { return <p className="text-sm text-muted-foreground">Record more data to populate this section.</p>; }

function TrendChart({ points }: { points: Array<{ dayNumber: number; averageKd: number }> }) {
  const width = 720; const height = 220; const padding = 30; const max = Math.max(...points.map((point) => point.averageKd), 1);
  const coordinates = points.map((point, index) => ({ x: padding + (index * (width - padding * 2)) / Math.max(1, points.length - 1), y: height - padding - (point.averageKd / max) * (height - padding * 2), ...point }));
  return <div className="overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="min-w-[520px]" role="img" aria-label="K/D trend by training day"><line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="stroke-border" /><polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="3" points={coordinates.map((point) => `${point.x},${point.y}`).join(" ")} />{coordinates.map((point) => <g key={point.dayNumber}><circle cx={point.x} cy={point.y} r="5" fill="hsl(var(--primary))"><title>Day {point.dayNumber}: {point.averageKd.toFixed(2)} K/D</title></circle><text x={point.x} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">D{point.dayNumber}</text></g>)}</svg></div>;
}
