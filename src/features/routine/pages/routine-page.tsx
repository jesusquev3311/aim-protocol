import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Crosshair, MoveHorizontal, Play, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressStepper, type ProgressStep } from "@/components/ui/progress-stepper";
import { useFinishRoutineDay, useRoutineSessionById, useSaveRoutineSession, useStartRoutineSession } from "@/features/routine/hooks/use-routine";
import { useRoutineProgram } from "@/features/routine/hooks/use-routine";
import { CornerStrafeDayPage } from "@/features/routine/pages/corner-strafe-day-page";
import { calculateRoutineProgress } from "@/features/routine/lib/routine-calculations";
import { routineSchema, type RoutineValues } from "@/features/routine/schemas/routine-schema";

const emptyRoutine = (): RoutineValues => ({ flickWarmupMinutes: 0, overaimBots: 0, underaimBots: 0, flickBots: 0, microflickMinutes: 0, peekLeftRepetitions: 0, peekRightRepetitions: 0, strafeCloseRepetitions: 0, strafeMidRepetitions: 0, strafeLongRepetitions: 0, practiceMinutes: 0, deathmatches: 0, rankedMatches: 0, warmupHits: null, microflickHits: null, deathmatchKills: null, deathmatchDeaths: null, deathmatchWeapon: null, perceivedDifficulty: null, confidenceBefore: null, confidenceAfter: null, sessionFocus: null, shootingErrorGraph: false, stopBeforeShooting: false, noCrouchSpray: false, burstStrafe: false, notes: "" });

export function RoutineDetailPage() {
  const { programId = "", sessionId = "" } = useParams();
  const program = useRoutineProgram(programId);
  if (program.isPending) return <p className="text-sm text-muted-foreground">Loading routine template…</p>;
  if (program.isError) return <p role="alert" className="text-sm text-red-400">Could not load this Routine Program.</p>;
  if (program.data.program.template_code === "corner_strafe_benchmark" && program.data.program.sets_per_side) return <CornerStrafeDayPage programId={programId} sessionId={sessionId} setsPerSide={program.data.program.sets_per_side} />;
  return <MechanicsRoutineDetailPage />;
}

function MechanicsRoutineDetailPage() {
  const { programId = "", sessionId = "" } = useParams();
  const session = useRoutineSessionById(sessionId);
  const saveMutation = useSaveRoutineSession();
  const finishMutation = useFinishRoutineDay();
  const startMutation = useStartRoutineSession();
  const [now, setNow] = useState(Date.now());
  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<RoutineValues>({ resolver: zodResolver(routineSchema), defaultValues: emptyRoutine() });

  useEffect(() => {
    const data = session.data;
    reset(data ? {
      flickWarmupMinutes: data.flick_warmup_minutes, overaimBots: data.overaim_bots, underaimBots: data.underaim_bots, flickBots: data.flick_bots,
      microflickMinutes: data.microflick_minutes, peekLeftRepetitions: data.peek_left_repetitions, peekRightRepetitions: data.peek_right_repetitions,
      strafeCloseRepetitions: data.strafe_close_repetitions, strafeMidRepetitions: data.strafe_mid_repetitions, strafeLongRepetitions: data.strafe_long_repetitions,
      practiceMinutes: data.practice_minutes, deathmatches: data.deathmatches,
      rankedMatches: data.ranked_matches, shootingErrorGraph: data.shooting_error_graph, stopBeforeShooting: data.stop_before_shooting,
      warmupHits: data.warmup_hits, microflickHits: data.microflick_hits, deathmatchKills: data.deathmatch_kills, deathmatchDeaths: data.deathmatch_deaths,
      deathmatchWeapon: data.deathmatch_weapon, perceivedDifficulty: data.perceived_difficulty, confidenceBefore: data.confidence_before,
      confidenceAfter: data.confidence_after, sessionFocus: data.session_focus,
      noCrouchSpray: data.no_crouch_spray, burstStrafe: data.burst_strafe, notes: data.notes ?? "",
    } : emptyRoutine());
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
  const timerStarted = Boolean(session.data.started_at);
  const timerMinutes = session.data.started_at ? calculateTimerMinutes(session.data.started_at, session.data.completed_at, now) : session.data.practice_minutes;
  const progressValues = { ...values, practiceMinutes: timerMinutes };
  const progress = timerStarted ? calculateRoutineProgress(progressValues) : 0;
  const dayFinished = Boolean(session.data?.completed_at);
  const routineSteps = buildRoutineSteps(values, timerStarted, dayFinished);
  const save = async (formValues: RoutineValues) => { try { await saveMutation.mutateAsync({ sessionId, values: formValues }); } catch { /* Feedback renders below. */ } };
  const finishDay = async (formValues: RoutineValues) => {
    const confirmed = window.confirm(`Finish this routine day at ${calculateRoutineProgress({ ...formValues, practiceMinutes: timerMinutes })}%? The timer will record ${timerMinutes} total session ${timerMinutes === 1 ? "minute" : "minutes"}.`);
    if (!confirmed) return;
    try {
      await saveMutation.mutateAsync({ sessionId, values: formValues });
      await finishMutation.mutateAsync({ sessionId, performedOn: getLocalDate() });
    } catch {
      // Mutation feedback is rendered below.
    }
  };

  return <section className="space-y-8"><div><Link to={`/routines/${programId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Routine Program</Link><div className="mt-6"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Routine day {session.data.day_number}</p><h1 className="mt-2 text-3xl font-bold">30-minute mechanics protocol</h1><p className="mt-2 max-w-3xl text-muted-foreground">{session.data.session_date ? `Completed ${formatLongDate(session.data.session_date)} · ` : ""}Start timing before the Range exercises, then play Deathmatch until the whole session reaches approximately 30 minutes.</p></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><Metric icon={<Timer />} label="Routine result" value={`${progress}%`} detail={dayFinished ? "Day finished · result recorded" : "Session still open"} /><Metric icon={<Play />} label="Whole-session timer" value={session.data.started_at ? formatElapsed(session.data.started_at, session.data.completed_at, now) : "Not started"} detail={session.data.started_at ? `Started at ${formatStartTime(session.data.started_at)} · target 30:00 · maximum 45:00` : "Includes Range, microflicks, and Deathmatch"} /></div>
    {!session.data.started_at && <Card className="border-primary/30"><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><p className="font-semibold">Start the complete training session</p><p className="mt-1 text-sm text-muted-foreground">Start this before exercise 1. Deathmatch is the final portion of the same 30-minute session.</p></div><Button type="button" disabled={startMutation.isPending} onClick={() => startMutation.mutate(sessionId)}><Play className="mr-2 h-4 w-4" />{startMutation.isPending ? "Starting…" : "Start routine"}</Button></CardContent></Card>}
    <Card className={dayFinished ? "border-emerald-500/40" : "border-primary/30"}><CardHeader><div className="flex items-center justify-between gap-4"><div><CardTitle className="text-lg">Routine stages</CardTitle><CardDescription>{dayFinished ? "Every stage is complete and the result is recorded." : "Move through the drills in order, then finish with Deathmatch."}</CardDescription></div><span className="shrink-0 text-sm font-semibold text-primary">{progress}% result</span></div></CardHeader><CardContent><ProgressStepper steps={routineSteps} ariaLabel="Routine stage progress" />{dayFinished && session.data?.completed_at && <p className="mt-3 text-xs text-muted-foreground">Finished {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.data.completed_at))}</p>}</CardContent></Card>
    <form className="space-y-6" onSubmit={handleSubmit(save)}><fieldset disabled={!timerStarted} className="space-y-6 disabled:opacity-60">
      <div className="grid gap-5 lg:grid-cols-2">
        <DrillCard number="01" title="Flick warm-up" target="3–10 minutes" description="Flick between two bots, make a controlled micro-adjustment, and shoot only when the crosshair is settled on the head." icon={<Crosshair />}><div className="grid gap-4 sm:grid-cols-2"><NumberField id="flickWarmupMinutes" label="Minutes completed" target="Between 3 and 10 minutes" max={10} error={errors.flickWarmupMinutes?.message} input={register("flickWarmupMinutes", { valueAsNumber: true })} /><NumberField id="warmupHits" label="Successful hits" target="Optional accuracy signal" error={errors.warmupHits?.message} input={register("warmupHits", optionalNumber)} /></div></DrillCard>
        <DrillCard number="02" title="Overaim + correction" target="One Easy run · 30 bots maximum · Vandal" description="Pass the head, correct back, stop completely, then fire." icon={<Crosshair />}><NumberField id="overaimBots" label="Bots killed" target="Score: 0–30" max={30} error={errors.overaimBots?.message} input={register("overaimBots", { valueAsNumber: true })} /></DrillCard>
        <DrillCard number="03" title="Underaim + movement" target="One Easy run · 30 bots maximum" description="Stop short with the mouse and use lateral movement to finish the alignment." icon={<MoveHorizontal />}><NumberField id="underaimBots" label="Bots killed" target="Score: 0–30" max={30} error={errors.underaimBots?.message} input={register("underaimBots", { valueAsNumber: true })} /></DrillCard>
        <DrillCard number="04" title="Flick + movement correction" target="One Easy run · 30 bots maximum" description="Flick toward the head; correct small misses with movement instead of only the mouse." icon={<Crosshair />}><NumberField id="flickBots" label="Bots killed" target="Score: 0–30" max={30} error={errors.flickBots?.message} input={register("flickBots", { valueAsNumber: true })} /></DrillCard>
        <DrillCard number="05" title="Microflicks" target="Approximately 3 minutes" description="Move immediately between two nearby bots without waiting to confirm the first kill." icon={<Timer />}><div className="grid gap-4 sm:grid-cols-2"><NumberField id="microflickMinutes" label="Minutes" target="Target: 3" error={errors.microflickMinutes?.message} input={register("microflickMinutes", { valueAsNumber: true })} /><NumberField id="microflickHits" label="Successful repetitions" target="Optional performance signal" error={errors.microflickHits?.message} input={register("microflickHits", optionalNumber)} /></div></DrillCard>
        <DrillCard number="06" title="Jiggle peek + shoot" target="20 repetitions per side" description="Move to the back of the Range. From each wall, jiggle peek the angle, stop, and shoot one bot before returning to cover." icon={<MoveHorizontal />}><div className="grid gap-4 sm:grid-cols-2"><NumberField id="peekLeftRepetitions" label="Left wall" target="Target: 20 repetitions" max={20} error={errors.peekLeftRepetitions?.message} input={register("peekLeftRepetitions", { valueAsNumber: true })} /><NumberField id="peekRightRepetitions" label="Right wall" target="Target: 20 repetitions" max={20} error={errors.peekRightRepetitions?.message} input={register("peekRightRepetitions", { valueAsNumber: true })} /></div></DrillCard>
        <DrillCard number="07" title="A/D strafe shooting" target="60 close · 60 mid · 60 long" description="Use a Vandal and fire only two-bullet bursts at head height. Alternate A and D, stop before every burst, then repeat from close, mid, and long distance." icon={<Crosshair />}><div className="grid gap-4 sm:grid-cols-3"><NumberField id="strafeCloseRepetitions" label="Close range" target="Target: 60" max={60} error={errors.strafeCloseRepetitions?.message} input={register("strafeCloseRepetitions", { valueAsNumber: true })} /><NumberField id="strafeMidRepetitions" label="Mid range" target="Target: 60" max={60} error={errors.strafeMidRepetitions?.message} input={register("strafeMidRepetitions", { valueAsNumber: true })} /><NumberField id="strafeLongRepetitions" label="Long range" target="Target: 60" max={60} error={errors.strafeLongRepetitions?.message} input={register("strafeLongRepetitions", { valueAsNumber: true })} /></div></DrillCard>
      </div>
      <Card className="border-primary/30"><CardHeader><CardTitle>Deathmatch module</CardTitle><CardDescription>After completing all seven exercises, play Deathmatch only until the entire session reaches approximately 30 minutes. The timer stops counting at 45 minutes.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label>Total session minutes</Label><div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm font-medium">{timerMinutes} min</div><p className="text-xs text-muted-foreground">Calculated automatically from the whole-session timer</p></div><NumberField id="deathmatches" label="Deathmatches played" target="Final portion of the timed training session" error={errors.deathmatches?.message} input={register("deathmatches", { valueAsNumber: true })} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Deathmatch performance context</CardTitle><CardDescription>Add optional objective results and perceived difficulty to make long-term Deathmatch comparisons more useful.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><NumberField id="deathmatchKills" label="Combined DM kills" target="Optional" error={errors.deathmatchKills?.message} input={register("deathmatchKills", optionalNumber)} /><NumberField id="deathmatchDeaths" label="Combined DM deaths" target="Optional" error={errors.deathmatchDeaths?.message} input={register("deathmatchDeaths", optionalNumber)} /><TextField id="deathmatchWeapon" label="Primary weapon" input={register("deathmatchWeapon")} /><NumberField id="perceivedDifficulty" label="Difficulty (1–5)" target="Optional" max={5} error={errors.perceivedDifficulty?.message} input={register("perceivedDifficulty", optionalNumber)} /><NumberField id="confidenceBefore" label="Confidence before (1–5)" target="Optional" max={5} error={errors.confidenceBefore?.message} input={register("confidenceBefore", optionalNumber)} /><NumberField id="confidenceAfter" label="Confidence after (1–5)" target="Optional" max={5} error={errors.confidenceAfter?.message} input={register("confidenceAfter", optionalNumber)} /><div className="sm:col-span-2"><TextField id="sessionFocus" label="Session focus" input={register("sessionFocus")} /></div></CardContent></Card>
      <Card className="border-amber-500/30"><CardHeader><CardTitle>Ranked module</CardTitle><CardDescription>Ranked games are tracked separately from the timed mechanics routine. Aim for approximately 14 games per week without forcing two every day.</CardDescription></CardHeader><CardContent className="max-w-sm"><NumberField id="rankedMatches" label="Ranked matches played" target="Separate weekly target: 14" error={errors.rankedMatches?.message} input={register("rankedMatches", { valueAsNumber: true })} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Gunfight hygiene</CardTitle><CardDescription>Use the Shooting Error Graph and judge execution quality, not Deathmatch placement.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{[["shootingErrorGraph", "Shooting Error Graph enabled"], ["stopBeforeShooting", "Completely stopped before firing"], ["noCrouchSpray", "Avoided crouch spraying"], ["burstStrafe", "Used 2 bullets → strafe → 2 bullets"]].map(([name, label]) => <label key={name} className="flex items-center gap-3 rounded-md border p-4 text-sm"><input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" {...register(name as "shootingErrorGraph" | "stopBeforeShooting" | "noCrouchSpray" | "burstStrafe")} /><CheckCircle2 className="h-4 w-4 text-primary" />{label}</label>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Session notes</CardTitle><CardDescription>Record rushed duels, angle-clearing problems, or one mechanic to emphasize tomorrow.</CardDescription></CardHeader><CardContent><textarea rows={5} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" {...register("notes")} />{errors.notes?.message && <p className="mt-2 text-sm text-red-400">{errors.notes.message}</p>}</CardContent></Card>
      {(saveMutation.isError || finishMutation.isError || startMutation.isError) && <p role="alert" className="text-sm text-red-400">{saveMutation.error?.message ?? finishMutation.error?.message ?? startMutation.error?.message}</p>}{finishMutation.isSuccess && <p role="status" className="text-sm text-emerald-400">Routine day finished and recorded.</p>}{saveMutation.isSuccess && !finishMutation.isSuccess && <p role="status" className="text-sm text-emerald-400">Routine session saved.</p>}<div className="flex flex-wrap justify-end gap-3"><Button type="submit" variant="outline" disabled={saveMutation.isPending || finishMutation.isPending || !isDirty}>{saveMutation.isPending ? "Saving…" : "Save progress"}</Button><Button type="button" disabled={saveMutation.isPending || finishMutation.isPending || (dayFinished && !isDirty)} onClick={handleSubmit((formValues) => void finishDay(formValues))}>{finishMutation.isPending ? "Finishing…" : dayFinished ? "Save and update finished day" : "Finish day"}</Button></div>
    </fieldset>{!timerStarted && <p className="text-right text-xs text-muted-foreground">Start the whole-session timer to unlock the routine inputs.</p>}</form>
  </section>;
}

function DrillCard({ number, title, target, description, icon, children }: { number: string; title: string; target: string; description: string; icon: React.ReactNode; children: React.ReactNode }) { return <Card><CardHeader><div className="flex items-start justify-between"><span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{number}</span><span className="h-5 w-5 text-primary">{icon}</span></div><CardTitle className="text-xl">{title}</CardTitle><CardDescription>{target}</CardDescription></CardHeader><CardContent><p className="mb-5 text-sm text-muted-foreground">{description}</p>{children}</CardContent></Card>; }
function NumberField({ id, label, target, max, error, input }: { id: string; label: string; target: string; max?: number; error?: string; input: UseFormRegisterReturn }) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type="number" min={0} max={max} {...input} /><p className="text-xs text-muted-foreground">{target}</p>{error && <p className="text-sm text-red-400">{error}</p>}</div>; }
function TextField({ id, label, input }: { id: string; label: string; input: UseFormRegisterReturn }) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} {...input} /></div>; }
function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) { return <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-5 w-5 text-primary">{icon}</span>{label}</div><p className="mt-3 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>; }
function formatLongDate(date: string) { return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(`${date}T00:00:00`)); }
function formatStartTime(date: string) { return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(date)); }
function formatElapsed(startedAt: string, completedAt: string | null, now: number) { const elapsedSeconds = Math.min(45 * 60, Math.max(0, Math.floor(((completedAt ? new Date(completedAt).getTime() : now) - new Date(startedAt).getTime()) / 1_000))); const minutes = Math.floor(elapsedSeconds / 60); const seconds = elapsedSeconds % 60; return `${minutes}:${seconds.toString().padStart(2, "0")}`; }
function calculateTimerMinutes(startedAt: string, completedAt: string | null, now: number) { const elapsedMilliseconds = Math.max(0, (completedAt ? new Date(completedAt).getTime() : now) - new Date(startedAt).getTime()); return Math.min(45, Math.ceil(elapsedMilliseconds / 60_000)); }
function getLocalDate() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); }
const optionalNumber = { setValueAs: (value: string) => value === "" ? null : Number(value) };
function buildRoutineSteps(values: RoutineValues, timerStarted: boolean, dayFinished: boolean): ProgressStep[] {
  const labels: Array<readonly [string, string]> = [
    ["Start", "Whole-session timer"],
    ["Warm-up", "Flick + micro-adjust"],
    ["Overaim", "30-bot run"],
    ["Underaim", "30-bot run"],
    ["Flick", "30-bot run"],
    ["Microflicks", "About 3 minutes"],
    ["Peek + shoot", "20 per side"],
    ["A/D shooting", "60 per distance"],
    ["Deathmatch", "Finish the day"],
  ];
  if (!timerStarted) return labels.map(([label, description], index) => ({ id: label.toLowerCase(), label, description, status: index === 0 ? "current" : "upcoming" }));
  const peekStarted = values.peekLeftRepetitions > 0 || values.peekRightRepetitions > 0;
  const strafeStarted = values.strafeCloseRepetitions > 0 || values.strafeMidRepetitions > 0 || values.strafeLongRepetitions > 0;
  const reached = [
    timerStarted,
    values.flickWarmupMinutes > 0 || values.overaimBots > 0 || values.underaimBots > 0 || values.flickBots > 0 || values.microflickMinutes > 0 || peekStarted || strafeStarted || values.deathmatches > 0,
    values.overaimBots > 0 || values.underaimBots > 0 || values.flickBots > 0 || values.microflickMinutes > 0 || peekStarted || strafeStarted || values.deathmatches > 0,
    values.underaimBots > 0 || values.flickBots > 0 || values.microflickMinutes > 0 || peekStarted || strafeStarted || values.deathmatches > 0,
    values.flickBots > 0 || values.microflickMinutes > 0 || peekStarted || strafeStarted || values.deathmatches > 0,
    values.microflickMinutes > 0 || peekStarted || strafeStarted || values.deathmatches > 0,
    peekStarted || strafeStarted || values.deathmatches > 0,
    strafeStarted || values.deathmatches > 0,
    dayFinished,
  ];
  const currentIndex = dayFinished ? -1 : reached.findIndex((stepReached) => !stepReached);
  return labels.map(([label, description], index) => ({ id: label.toLowerCase(), label, description, status: dayFinished || reached[index] ? "completed" : index === currentIndex ? "current" : "upcoming" }));
}
