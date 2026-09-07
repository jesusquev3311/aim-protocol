import { BarChart3, Crosshair, Gamepad2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGlobalStatistics } from "@/features/statistics/hooks/use-statistics";

export function StatisticsPage() {
  const query = useGlobalStatistics();
  if (query.isPending) return <p className="text-sm text-muted-foreground">Analyzing your training…</p>;
  if (query.isError) return <p role="alert" className="text-sm text-red-400">Could not load analytics.</p>;
  return <StatisticsContent stats={query.data} title="Global performance" description="Trends across all of your challenges, matches, and skill evaluations." />;
}

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
