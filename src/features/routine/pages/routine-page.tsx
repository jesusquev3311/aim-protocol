import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Crosshair, MoveHorizontal, Play, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinishRoutineDay, useRoutineSessionById, useSaveRoutineSession, useStartRoutineSession } from "@/features/routine/hooks/use-routine";
import { calculateRoutineProgress } from "@/features/routine/lib/routine-calculations";
import { routineSchema, type RoutineValues } from "@/features/routine/schemas/routine-schema";

const emptyRoutine = (date: string): RoutineValues => ({ sessionDate: date, overaimBots: 0, underaimBots: 0, flickBots: 0, microflickMinutes: 0, practiceMinutes: 0, deathmatches: 0, rankedMatches: 0, shootingErrorGraph: false, stopBeforeShooting: false, noCrouchSpray: false, burstStrafe: false, notes: "" });

export function RoutineDetailPage() {
  const { programId = "", sessionId = "" } = useParams();
  const session = useRoutineSessionById(sessionId);
  const saveMutation = useSaveRoutineSession();
  const finishMutation = useFinishRoutineDay();
  const startMutation = useStartRoutineSession();
  const [now, setNow] = useState(Date.now());
  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<RoutineValues>({ resolver: zodResolver(routineSchema), defaultValues: emptyRoutine("") });

  useEffect(() => {
    const data = session.data;
    reset(data ? {
      sessionDate: data.session_date, overaimBots: data.overaim_bots, underaimBots: data.underaim_bots, flickBots: data.flick_bots,
      microflickMinutes: data.microflick_minutes, practiceMinutes: data.practice_minutes, deathmatches: data.deathmatches,
      rankedMatches: data.ranked_matches, shootingErrorGraph: data.shooting_error_graph, stopBeforeShooting: data.stop_before_shooting,
      noCrouchSpray: data.no_crouch_spray, burstStrafe: data.burst_strafe, notes: data.notes ?? "",
    } : emptyRoutine(""));
  }, [reset, session.data]);

  useEffect(() => {
    if (!session.data?.started_at || session.data.completed_at) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [session.data?.completed_at, session.data?.started_at]);

  if (session.isPending) return <p className="text-sm text-muted-foreground">Loading routine day…</p>;
  if (session.isError) return <p role="alert" className="text-sm text-red-400">Could not load this routine day.</p>;
  if (session.data.routine_program_id !== programId) return <Navigate to="/routines" replace />;
  const values = watch();
  const progress = calculateRoutineProgress(values);
  const dayFinished = Boolean(session.data?.completed_at);
  const save = async (formValues: RoutineValues) => { try { await saveMutation.mutateAsync({ sessionId, values: formValues }); } catch { /* Feedback renders below. */ } };
  const finishDay = async (formValues: RoutineValues) => {
    const confirmed = window.confirm(`Finish this routine day at ${calculateRoutineProgress(formValues)}%? Your current results will be saved as the final outcome for the day.`);
    if (!confirmed) return;
    try {
      await saveMutation.mutateAsync({ sessionId, values: formValues });
      await finishMutation.mutateAsync(sessionId);
    } catch {
      // Mutation feedback is rendered below.
    }
  };

  return <section className="space-y-8"><div><Link to={`/routines/${programId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Routine Program</Link><div className="mt-6"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Routine day {session.data.day_number}</p><h1 className="mt-2 text-3xl font-bold">30-minute mechanics protocol</h1><p className="mt-2 max-w-3xl text-muted-foreground">{formatLongDate(session.data.session_date)} · Start timing before the Range exercises, then play Deathmatch until the whole session reaches approximately 30 minutes.</p></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><Metric icon={<Timer />} label="Routine result" value={`${progress}%`} detail={dayFinished ? "Day finished · result recorded" : "Session still open"} /><Metric icon={<Play />} label="Whole-session timer" value={session.data.started_at ? formatElapsed(session.data.started_at, session.data.completed_at, now) : "Not started"} detail={session.data.started_at ? `Started at ${formatStartTime(session.data.started_at)} · target 30:00` : "Includes Range, microflicks, and Deathmatch"} /></div>
    {!session.data.started_at && <Card className="border-primary/30"><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><p className="font-semibold">Start the complete training session</p><p className="mt-1 text-sm text-muted-foreground">Start this before exercise 1. Deathmatch is the final portion of the same 30-minute session.</p></div><Button type="button" disabled={startMutation.isPending} onClick={() => startMutation.mutate(sessionId)}><Play className="mr-2 h-4 w-4" />{startMutation.isPending ? "Starting…" : "Start routine"}</Button></CardContent></Card>}
    <Card className={dayFinished ? "border-emerald-500/40" : "border-primary/30"}><CardContent className="pt-6"><div className="mb-2 flex justify-between text-sm"><span>{dayFinished ? "Day finished · achieved result recorded" : "Current routine result"}</span><span>{progress}%</span></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${dayFinished ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${progress}%` }} /></div>{dayFinished && session.data?.completed_at && <p className="mt-3 text-xs text-muted-foreground">Finished {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.data.completed_at))}</p>}</CardContent></Card>
    <form className="space-y-6" onSubmit={handleSubmit(save)}><input type="hidden" {...register("sessionDate")} />
      <div className="grid gap-5 lg:grid-cols-2">
        <DrillCard number="01" title="Overaim + correction" target="One Easy run · 30 bots maximum · Vandal" description="Pass the head, correct back, stop completely, then fire." icon={<Crosshair />}><NumberField id="overaimBots" label="Bots killed" target="Score: 0–30" max={30} error={errors.overaimBots?.message} input={register("overaimBots", { valueAsNumber: true })} /></DrillCard>
        <DrillCard number="02" title="Underaim + movement" target="One Easy run · 30 bots maximum" description="Stop short with the mouse and use lateral movement to finish the alignment." icon={<MoveHorizontal />}><NumberField id="underaimBots" label="Bots killed" target="Score: 0–30" max={30} error={errors.underaimBots?.message} input={register("underaimBots", { valueAsNumber: true })} /></DrillCard>
        <DrillCard number="03" title="Flick + movement correction" target="One Easy run · 30 bots maximum" description="Flick toward the head; correct small misses with movement instead of only the mouse." icon={<Crosshair />}><NumberField id="flickBots" label="Bots killed" target="Score: 0–30" max={30} error={errors.flickBots?.message} input={register("flickBots", { valueAsNumber: true })} /></DrillCard>
        <DrillCard number="04" title="Microflicks" target="Approximately 3 minutes" description="Move immediately between two nearby bots without waiting to confirm the first kill." icon={<Timer />}><NumberField id="microflickMinutes" label="Minutes" target="Target: 3" error={errors.microflickMinutes?.message} input={register("microflickMinutes", { valueAsNumber: true })} /></DrillCard>
      </div>
      <Card><CardHeader><CardTitle>Deathmatch and total training time</CardTitle><CardDescription>After completing the Range and microflick exercises, play Deathmatch only until the entire session reaches approximately 30 minutes.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-3"><NumberField id="practiceMinutes" label="Total session minutes" target="Range + microflicks + Deathmatch · recommended: 30" error={errors.practiceMinutes?.message} input={register("practiceMinutes", { valueAsNumber: true })} /><NumberField id="deathmatches" label="Deathmatches played" target="Final portion of the session" error={errors.deathmatches?.message} input={register("deathmatches", { valueAsNumber: true })} /><NumberField id="rankedMatches" label="Ranked matches" target="Weekly target: 14" error={errors.rankedMatches?.message} input={register("rankedMatches", { valueAsNumber: true })} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Gunfight hygiene</CardTitle><CardDescription>Use the Shooting Error Graph and judge execution quality, not Deathmatch placement.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{[["shootingErrorGraph", "Shooting Error Graph enabled"], ["stopBeforeShooting", "Completely stopped before firing"], ["noCrouchSpray", "Avoided crouch spraying"], ["burstStrafe", "Used 2 bullets → strafe → 2 bullets"]].map(([name, label]) => <label key={name} className="flex items-center gap-3 rounded-md border p-4 text-sm"><input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" {...register(name as "shootingErrorGraph" | "stopBeforeShooting" | "noCrouchSpray" | "burstStrafe")} /><CheckCircle2 className="h-4 w-4 text-primary" />{label}</label>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Session notes</CardTitle><CardDescription>Record rushed duels, angle-clearing problems, or one mechanic to emphasize tomorrow.</CardDescription></CardHeader><CardContent><textarea rows={5} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" {...register("notes")} />{errors.notes?.message && <p className="mt-2 text-sm text-red-400">{errors.notes.message}</p>}</CardContent></Card>
      {(saveMutation.isError || finishMutation.isError || startMutation.isError) && <p role="alert" className="text-sm text-red-400">{saveMutation.error?.message ?? finishMutation.error?.message ?? startMutation.error?.message}</p>}{finishMutation.isSuccess && <p role="status" className="text-sm text-emerald-400">Routine day finished and recorded.</p>}{saveMutation.isSuccess && !finishMutation.isSuccess && <p role="status" className="text-sm text-emerald-400">Routine session saved.</p>}<div className="flex flex-wrap justify-end gap-3"><Button type="submit" variant="outline" disabled={saveMutation.isPending || finishMutation.isPending || !isDirty}>{saveMutation.isPending ? "Saving…" : "Save progress"}</Button><Button type="button" disabled={saveMutation.isPending || finishMutation.isPending || (dayFinished && !isDirty)} onClick={handleSubmit((formValues) => void finishDay(formValues))}>{finishMutation.isPending ? "Finishing…" : dayFinished ? "Save and update finished day" : "Finish day"}</Button></div>
    </form>
  </section>;
}

function DrillCard({ number, title, target, description, icon, children }: { number: string; title: string; target: string; description: string; icon: React.ReactNode; children: React.ReactNode }) { return <Card><CardHeader><div className="flex items-start justify-between"><span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{number}</span><span className="h-5 w-5 text-primary">{icon}</span></div><CardTitle className="text-xl">{title}</CardTitle><CardDescription>{target}</CardDescription></CardHeader><CardContent><p className="mb-5 text-sm text-muted-foreground">{description}</p>{children}</CardContent></Card>; }
function NumberField({ id, label, target, max, error, input }: { id: string; label: string; target: string; max?: number; error?: string; input: UseFormRegisterReturn }) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type="number" min={0} max={max} {...input} /><p className="text-xs text-muted-foreground">{target}</p>{error && <p className="text-sm text-red-400">{error}</p>}</div>; }
function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) { return <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-5 w-5 text-primary">{icon}</span>{label}</div><p className="mt-3 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>; }
function formatLongDate(date: string) { return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(`${date}T00:00:00`)); }
function formatStartTime(date: string) { return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(date)); }
function formatElapsed(startedAt: string, completedAt: string | null, now: number) { const elapsedSeconds = Math.max(0, Math.floor(((completedAt ? new Date(completedAt).getTime() : now) - new Date(startedAt).getTime()) / 1_000)); const minutes = Math.floor(elapsedSeconds / 60); const seconds = elapsedSeconds % 60; return `${minutes}:${seconds.toString().padStart(2, "0")}`; }
