import { CalendarDays, CheckCircle2, ChevronRight, Dumbbell, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRoutineHistory } from "@/features/routine/hooks/use-routine";
import { calculateRoutineProgress } from "@/features/routine/lib/routine-calculations";

export function RoutineListPage() {
  const navigate = useNavigate();
  const today = useMemo(getLocalDate, []);
  const [sessionDate, setSessionDate] = useState(today);
  const history = useRoutineHistory("2000-01-01");

  return <section className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Routines</p><h1 className="mt-2 text-3xl font-bold">Mechanics routine history</h1><p className="mt-2 text-muted-foreground">Open a training day to record its exercises, actual scores, and practice volume.</p></div><Link to={`/routine/${today}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Today's routine</Link></div>

    <Card className="border-primary/30"><CardHeader><CardTitle>Open a routine day</CardTitle><CardDescription>Choose today or a past date to add results you trained before using the app.</CardDescription></CardHeader><CardContent><div className="flex max-w-md flex-wrap items-end gap-3"><div className="min-w-52 flex-1 space-y-2"><Label htmlFor="routine-date">Session date</Label><Input id="routine-date" type="date" max={today} value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} /></div><Button type="button" disabled={!sessionDate} onClick={() => navigate(`/routine/${sessionDate}`)}>Open routine</Button></div></CardContent></Card>

    <Card><CardHeader><CardTitle>Recorded routines</CardTitle><CardDescription>Finished and in-progress routine days, ordered from newest to oldest.</CardDescription></CardHeader><CardContent className="space-y-3">
      {history.isPending && <p className="text-sm text-muted-foreground">Loading routine history…</p>}
      {history.isError && <p role="alert" className="text-sm text-red-400">Could not load routine history.</p>}
      {history.data?.length ? history.data.map((item) => {
        const result = calculateRoutineProgress({ overaimBots: item.overaim_bots, underaimBots: item.underaim_bots, flickBots: item.flick_bots, microflickMinutes: item.microflick_minutes, practiceMinutes: item.practice_minutes });
        return <Link key={item.id} to={`/routine/${item.session_date}`} className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4 transition-colors hover:border-primary/60 hover:bg-muted/40"><div><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /><span className="font-semibold">{formatDate(item.session_date)}</span>{item.completed_at && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400"><CheckCircle2 className="h-3 w-3" />Finished</span>}</div><p className="mt-2 text-sm text-muted-foreground">Scores {item.overaim_bots}/30 · {item.underaim_bots}/30 · {item.flick_bots}/30 · {item.practice_minutes} min · {item.deathmatches} DM</p></div><div className="flex items-center gap-4"><span className="inline-flex items-center gap-2 text-sm"><Dumbbell className="h-4 w-4 text-primary" />{result}% result</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></div></Link>;
      }) : !history.isPending && !history.isError && <div className="rounded-md border border-dashed p-8 text-center"><p className="font-medium">No routines recorded yet</p><p className="mt-2 text-sm text-muted-foreground">Open today's routine to start tracking your mechanics training.</p></div>}
    </CardContent></Card>
  </section>;
}

function getLocalDate() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); }
function formatDate(date: string) { return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(`${date}T00:00:00`)); }
