import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useBenchmarkStatistics, useRoutineStatistics } from "@/features/statistics/hooks/use-statistics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoutineStatisticsContent } from "@/features/statistics/pages/routine-statistics-content";

export function RoutineStatisticsPage() {
  const { programId = "" } = useParams();
  const query = useRoutineStatistics(programId);
  const benchmark = useBenchmarkStatistics(programId);
  if (query.isPending) return <p className="text-sm text-muted-foreground">Analyzing this Routine Program…</p>;
  if (query.isError || !query.data.programs[0]) return <p role="alert" className="text-sm text-red-400">Could not load routine analytics.</p>;
  const program = query.data.programs[0];
  if (program.template_code === "corner_strafe_benchmark") {
    if (benchmark.isPending) return <p className="text-sm text-muted-foreground">Analyzing benchmark sets…</p>;
    if (benchmark.isError) return <p role="alert" className="text-sm text-red-400">Could not load benchmark analytics.</p>;
    return <Page programId={programId} name={program.name} description="Timing, side balance, execution quality, and weapon progression for this benchmark."><BenchmarkContent statistics={benchmark.data} /></Page>;
  }
  return <Page programId={programId} name={program.name} description="Mechanical improvement, training consistency, and execution quality for this program only."><RoutineStatisticsContent statistics={query.data.statistics} /></Page>;
}

function Page({ programId, name, description, children }: { programId: string; name: string; description: string; children: React.ReactNode }) { return <section className="space-y-8"><div><Link to={`/routines/${programId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Routine Program</Link><p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">Routine analytics</p><h1 className="mt-2 text-3xl font-bold">{name}</h1><p className="mt-2 text-muted-foreground">{description}</p></div>{children}</section>; }
function BenchmarkContent({ statistics }: { statistics: ReturnType<typeof import("@/features/statistics/lib/benchmark-statistics").buildBenchmarkStatistics> }) { return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Complete sets" value={String(statistics.completedSets)} /><Metric label="Median time" value={formatSeconds(statistics.medianSeconds)} /><Metric label="Best time" value={formatSeconds(statistics.bestSeconds)} /><Metric label="Clean execution" value={`${statistics.cleanPercent}%`} /></div><Card><CardHeader><CardTitle>Opening versus recent sets</CardTitle><CardDescription>Five-set medians reduce the effect of unusually fast or interrupted sets.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3"><Metric label="Opening" value={formatSeconds(statistics.openingMedian)} /><Metric label="Recent" value={formatSeconds(statistics.recentMedian)} /><Metric label="Change" value={statistics.improvementSeconds ? `${statistics.improvementSeconds > 0 ? "-" : "+"}${Math.abs(statistics.improvementSeconds).toFixed(1)}s` : "—"} /></CardContent></Card><div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Corner balance</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-4"><Metric label="Left median" value={formatSeconds(statistics.leftMedian)} /><Metric label="Right median" value={formatSeconds(statistics.rightMedian)} /></CardContent></Card><Card><CardHeader><CardTitle>Weapon timing</CardTitle></CardHeader><CardContent className="space-y-3">{statistics.weaponStats.length ? statistics.weaponStats.map((weapon) => <div key={weapon.weapon} className="flex justify-between rounded-md border p-3 text-sm"><span>{weapon.weapon}</span><span>{formatSeconds(weapon.medianSeconds)} · {weapon.sets} sets</span></div>) : <p className="text-sm text-muted-foreground">Record timed sets to compare weapons.</p>}</CardContent></Card></div><Card className="border-primary/30"><CardHeader><CardTitle>Benchmark insights</CardTitle></CardHeader><CardContent><ul className="space-y-3">{statistics.insights.map((insight) => <li key={insight} className="rounded-md bg-muted/50 p-4 text-sm">{insight}</li>)}</ul></CardContent></Card></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>; }
function formatSeconds(seconds: number) { return seconds ? `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}` : "—"; }
