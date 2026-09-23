import { ArrowLeft, CalendarDays, CheckCircle2, ChevronRight, Clock3, Flag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinishRoutineProgram, useRoutineProgram } from "@/features/routine/hooks/use-routine";
import { calculateRoutineProgress } from "@/features/routine/lib/routine-calculations";
import { cn } from "@/lib/utils";

export function RoutineProgramPage() {
  const { programId = "" } = useParams();
  const query = useRoutineProgram(programId);
  const finishMutation = useFinishRoutineProgram();
  if (query.isPending) return <p className="text-sm text-muted-foreground">Loading Routine Program…</p>;
  if (query.isError) return <p role="alert" className="text-sm text-red-400">Could not load this Routine Program.</p>;
  const { program, days } = query.data;
  const completed = days.filter((day) => day.completed_at).length;
  const percentage = days.length ? Math.round((completed / days.length) * 100) : 0;

  return <section className="space-y-8"><div><Link to="/routines" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Routine Programs</Link><div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Routine Program</p><h1 className="mt-2 text-3xl font-bold">{program.name}</h1><p className="mt-2 text-muted-foreground">{program.duration_days} calendar days starting {formatDate(program.start_date)} · {formatWeekdays(program.weekdays)}</p></div><span className={cn("rounded-full px-3 py-1 text-sm font-medium capitalize", program.status === "active" ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-400")}>{program.status}</span></div></div>
    <div className="grid gap-4 sm:grid-cols-3"><Metric icon={<CalendarDays />} label="Scheduled sessions" value={String(days.length)} /><Metric icon={<CheckCircle2 />} label="Days finished" value={`${completed} / ${days.length}`} /><Metric icon={<Clock3 />} label="Total practice" value={`${days.reduce((sum, day) => sum + day.practice_minutes, 0)} min`} /></div>
    <Card className="border-primary/30"><CardContent className="pt-6"><div className="mb-2 flex justify-between text-sm"><span>Program progress</span><span>{percentage}%</span></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} /></div></CardContent></Card>
    <Card><CardHeader><CardTitle>Routine days</CardTitle><CardDescription>Open any scheduled day to start the full-session timer, record actual results, or edit previous data.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{days.map((day) => { const result = calculateRoutineProgress({ overaimBots: day.overaim_bots, underaimBots: day.underaim_bots, flickBots: day.flick_bots, microflickMinutes: day.microflick_minutes, practiceMinutes: day.practice_minutes }); return <Link key={day.id} to={`/routines/${program.id}/days/${day.id}`} className={cn("flex items-center justify-between rounded-md border p-4 hover:border-primary/60 hover:bg-muted/40", day.completed_at && "border-emerald-500/30")}><div><p className="font-semibold">Session {day.day_number}</p><p className="mt-1 text-sm text-muted-foreground">{formatDate(day.session_date)} · {day.completed_at ? `Finished · ${result}% result` : day.started_at ? "In progress" : "Not started"}</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>; })}</CardContent></Card>
    {program.status === "active" && <Card className="border-amber-500/30"><CardHeader><CardTitle>Program actions</CardTitle><CardDescription>Finish the program early to preserve current results and allow a new Routine Program.</CardDescription></CardHeader><CardContent className="space-y-3"><Button variant="outline" className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10" disabled={finishMutation.isPending} onClick={() => { if (window.confirm("Finish this Routine Program now? Unfinished scheduled days will remain incomplete, and current results will be preserved.")) finishMutation.mutate(program.id); }}><Flag className="mr-2 h-4 w-4" />{finishMutation.isPending ? "Finishing…" : "Finish program"}</Button>{finishMutation.isError && <p role="alert" className="text-sm text-red-400">{finishMutation.error.message}</p>}</CardContent></Card>}
  </section>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-5 w-5 text-primary">{icon}</span>{label}</div><p className="mt-3 text-2xl font-bold">{value}</p></CardContent></Card>; }
function formatDate(date: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00`)); }
function formatWeekdays(days: number[]) { return days.length === 7 ? "Every day" : days.map((day) => ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][day]).join(", "); }
