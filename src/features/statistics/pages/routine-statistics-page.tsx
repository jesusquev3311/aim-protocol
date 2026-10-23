import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useRoutineStatistics } from "@/features/statistics/hooks/use-statistics";
import { RoutineStatisticsContent } from "@/features/statistics/pages/routine-statistics-content";

export function RoutineStatisticsPage() {
  const { programId = "" } = useParams();
  const query = useRoutineStatistics(programId);
  if (query.isPending) return <p className="text-sm text-muted-foreground">Analyzing this Routine Program…</p>;
  if (query.isError || !query.data.programs[0]) return <p role="alert" className="text-sm text-red-400">Could not load routine analytics.</p>;
  const program = query.data.programs[0];
  return <section className="space-y-8"><div><Link to={`/routines/${programId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Routine Program</Link><p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">Routine analytics</p><h1 className="mt-2 text-3xl font-bold">{program.name}</h1><p className="mt-2 text-muted-foreground">Mechanical improvement, training consistency, and execution quality for this program only.</p></div><RoutineStatisticsContent statistics={query.data.statistics} /></section>;
}
