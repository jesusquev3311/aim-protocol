import { CalendarDays, CheckCircle2, ChevronRight, Dumbbell, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoutineHistory, useRoutinePrograms } from "@/features/routine/hooks/use-routine";

export function RoutineListPage() {
  const programs = useRoutinePrograms();
  const history = useRoutineHistory("2000-01-01");
  if (programs.isPending) return <p className="text-sm text-muted-foreground">Loading routine programs…</p>;
  if (programs.isError) return <p role="alert" className="text-sm text-red-400">Could not load routine programs.</p>;
  const hasActive = programs.data.some((program) => program.status === "active");
  const importedSessions = history.data?.filter((session) => !session.routine_program_id) ?? [];

  return <section className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Routines</p><h1 className="mt-2 text-3xl font-bold">Routine Programs</h1><p className="mt-2 text-muted-foreground">Follow the 30-minute mechanics routine on a schedule and review each completed program.</p></div>{hasActive ? <span className="rounded-md border px-4 py-2 text-sm text-muted-foreground">Complete the active program before starting another</span> : <Link to="/routines/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New Routine Program</Link>}</div>
    <Card><CardHeader><CardTitle>Programs</CardTitle><CardDescription>Active and completed mechanics training programs.</CardDescription></CardHeader><CardContent className="space-y-3">{programs.data.length ? programs.data.map((program) => <Link key={program.id} to={`/routines/${program.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4 transition-colors hover:border-primary/60 hover:bg-muted/40"><div><div className="flex items-center gap-3"><Dumbbell className="h-4 w-4 text-primary" /><span className="font-semibold">{program.name}</span><Status status={program.status} /></div><p className="mt-2 text-sm text-muted-foreground">{program.duration_days} calendar days · Starts {formatDate(program.start_date)} · {formatWeekdays(program.weekdays)}</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>) : <div className="rounded-md border border-dashed p-8 text-center"><p className="font-medium">No Routine Programs yet</p><p className="mt-2 text-sm text-muted-foreground">Create a program to generate your scheduled training days.</p></div>}</CardContent></Card>
    {importedSessions.length > 0 && <Card><CardHeader><CardTitle>Imported routine history</CardTitle><CardDescription>Your standalone sessions were preserved when Routine Programs were introduced.</CardDescription></CardHeader><CardContent className="space-y-2">{importedSessions.map((session) => <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4"><span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{formatDate(session.session_date)}</span><span className="text-sm text-muted-foreground">{session.completed_at ? <span className="inline-flex items-center gap-1 text-emerald-400"><CheckCircle2 className="h-3 w-3" />Finished</span> : "In progress"} · {session.practice_minutes} total min · {session.deathmatches} DM</span></div>)}</CardContent></Card>}
  </section>;
}

function Status({ status }: { status: "active" | "completed" | "abandoned" }) { const style = status === "active" ? "bg-primary/10 text-primary" : status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"; return <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${style}`}>{status}</span>; }
function formatDate(date: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00`)); }
function formatWeekdays(days: number[]) { return days.length === 7 ? "Every day" : days.map((day) => ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day]).join(", "); }
