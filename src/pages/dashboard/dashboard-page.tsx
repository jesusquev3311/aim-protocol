import { BarChart3, CalendarDays, ChevronRight, Crown, Flag, Gamepad2, Plus, RotateCcw, Settings, Sparkles, Target, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChallenges, useFinishChallenge, useResetChallenge } from "@/features/challenges/hooks/use-challenges";
import { useChallengeStatistics, useGlobalStatistics } from "@/features/statistics/hooks/use-statistics";
import { useTrainingOverview } from "@/features/training/hooks/use-training";
import { calculateAverageKd, getCurrentTrainingDay } from "@/features/training/lib/training-calculations";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const challengesQuery = useChallenges();

  if (challengesQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading your dashboard…</p>;
  }

  if (challengesQuery.isError) {
    return <p role="alert" className="text-sm text-red-400">Could not load your challenge. Try refreshing the page.</p>;
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Dashboard</p><h1 className="mt-2 text-3xl font-bold">Your training overview</h1><p className="mt-2 text-muted-foreground">Review your latest performance and open any challenge.</p></div>{challengesQuery.data.some((challenge) => challenge.status === "active") ? <Link to={`/challenges/${challengesQuery.data.find((challenge) => challenge.status === "active")?.id}`} className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted">View active challenge<ChevronRight className="h-4 w-4" /></Link> : <Link to="/challenges/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New challenge</Link>}</div>
      <DashboardAnalytics />
      <ChallengeList challenges={challengesQuery.data} />
    </section>
  );
}

type Challenge = NonNullable<ReturnType<typeof useChallenges>["data"]>[number];

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const navigate = useNavigate();
  const overview = useTrainingOverview(challenge.id);
  const statistics = useChallengeStatistics(challenge.id);
  const finishMutation = useFinishChallenge();
  const resetMutation = useResetChallenge();
  const startDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${challenge.start_date}T00:00:00`));
  const currentDay = overview.data ? getCurrentTrainingDay(overview.data.days) : null;
  const currentMatches = currentDay ? overview.data?.matches.filter((match) => match.training_day_id === currentDay.id) ?? [] : [];
  const completedDays = overview.data?.days.filter((day) => day.status === "completed").length ?? 0;
  const progress = Math.round((completedDays / challenge.duration_days) * 100);
  const finish = async () => {
    const confirmed = window.confirm("Finish this challenge now? Incomplete days will remain incomplete, and the current results will be finalized.");
    if (!confirmed) return;
    try {
      await finishMutation.mutateAsync(challenge.id);
      navigate(`/challenges/${challenge.id}/completed`);
    } catch {
      // Mutation feedback is rendered below the actions.
    }
  };
  const resetChallenge = async () => {
    const confirmed = window.confirm("Reset this challenge? All matches, evaluations, notes, completion dates, and achievements will be permanently erased. This cannot be undone.");
    if (!confirmed) return;
    try { await resetMutation.mutateAsync(challenge.id); } catch { /* Mutation feedback is rendered below. */ }
  };

  return (
    <div className="mt-8 space-y-6">
      <AnalyticsSummary analyticsHref={`/challenges/${challenge.id}/analytics`} statistics={statistics} title="Challenge analytics" />
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle>{challenge.status === "completed" ? "Completed challenge" : "Active challenge"}</CardTitle><CardDescription className="mt-2">{challenge.duration_days} days starting {startDate}</CardDescription></div>{challenge.status === "active" && <Link to={`/challenges/${challenge.id}/settings`} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"><Settings className="h-4 w-4" />Settings</Link>}</CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric icon={<CalendarDays className="h-5 w-5 text-primary" />} label="Current day" value={currentDay ? `Day ${currentDay.day_number}` : "Preparing…"} />
            <Metric icon={<Gamepad2 className="h-5 w-5 text-primary" />} label="Current day's matches" value={`${currentMatches.length} / ${challenge.matches_per_day} max`} />
            <Metric icon={<Target className="h-5 w-5 text-primary" />} label="Current day's K/D" value={calculateAverageKd(currentMatches).toFixed(2)} />
            <Metric icon={<CalendarDays className="h-5 w-5 text-primary" />} label="Days completed" value={`${completedDays} / ${challenge.duration_days}`} />
          </div>
          <ChallengeProgressTrack completedDays={completedDays} durationDays={challenge.duration_days} progress={progress} />
          <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-5"><div className="flex gap-5 text-sm text-muted-foreground"><span>{completedDays} days completed</span><span className="flex items-center gap-1"><Sparkles className="h-4 w-4" />Recommended mode {challenge.recommended_mode ? "on" : "off"}</span></div>{challenge.status === "completed" ? <div className="flex gap-3"><Link to={`/challenges/${challenge.id}/analytics`} className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold hover:bg-muted">Analytics</Link><Link to={`/challenges/${challenge.id}/completed`} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">View results</Link></div> : currentDay && <Link to={`/training/${currentDay.id}`} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Open current training</Link>}</div>
          {overview.isError && <p role="alert" className="text-sm text-red-400">Could not load training progress.</p>}
        </CardContent>
      </Card>
      {overview.data && <TrainingCalendar days={overview.data.days} matches={overview.data.matches} dailyTarget={challenge.matches_per_day} currentDayId={currentDay?.id ?? null} />}
      <Card className="border-amber-500/30"><CardHeader><CardTitle>Challenge actions</CardTitle><CardDescription>Finish to preserve current results, or reset to start this challenge from day one.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-3">{challenge.status === "active" && <Button onClick={() => void finish()} disabled={finishMutation.isPending}><Flag className="mr-2 h-4 w-4" />{finishMutation.isPending ? "Finishing…" : "Finish challenge"}</Button>}<Button variant="outline" className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10" onClick={() => void resetChallenge()} disabled={resetMutation.isPending}><RotateCcw className="mr-2 h-4 w-4" />{resetMutation.isPending ? "Resetting…" : "Reset challenge"}</Button></div>{finishMutation.isError && <p role="alert" className="text-sm text-red-400">{finishMutation.error.message}</p>}{resetMutation.isError && <p role="alert" className="text-sm text-red-400">{resetMutation.error.message}</p>}</CardContent></Card>
    </div>
  );
}

function ChallengeProgressTrack({ completedDays, durationDays, progress }: { completedDays: number; durationDays: number; progress: number }) {
  const tiers = [0, 25, 50, 75, 100];
  return <div className="rounded-lg border bg-background/50 px-5 pb-5 pt-4"><div className="mb-5 flex items-center justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Protocol pass</p><p className="mt-1 text-sm text-muted-foreground">{completedDays} / {durationDays} days completed</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">Tier {Math.min(4, Math.floor(progress / 25)) + 1}</span></div><div className="relative px-2"><div className="absolute left-2 right-2 top-4 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all" style={{ width: `${progress}%` }} /></div><div className="relative flex justify-between">{tiers.map((tier, index) => { const reached = progress >= tier; return <div key={tier} className="flex w-10 flex-col items-center"><span className={`z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold ${reached ? "border-primary bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.45)]" : "border-border bg-card text-muted-foreground"}`}>{index === tiers.length - 1 ? <Crown className="h-4 w-4" /> : index + 1}</span><span className="mt-2 whitespace-nowrap text-[10px] text-muted-foreground">{tier}%</span></div>; })}</div></div></div>;
}

function DashboardAnalytics() {
  const statistics = useGlobalStatistics();
  return <AnalyticsSummary analyticsHref="/statistics" statistics={statistics} title="Global analytics" />;
}

function ChallengeList({ challenges }: { challenges: Challenge[] }) {
  if (!challenges.length) return <EmptyChallengeState />;
  return <Card><CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle>Challenges</CardTitle><CardDescription className="mt-2">Active and completed training protocols.</CardDescription></div>{!challenges.some((challenge) => challenge.status === "active") && <Link to="/challenges/new" className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New challenge</Link>}</CardHeader><CardContent className="space-y-3">{challenges.map((challenge) => { const startDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${challenge.start_date}T00:00:00`)); return <div key={challenge.id} className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4"><div><div className="flex items-center gap-3"><span className="font-semibold">{challenge.duration_days}-day challenge</span><StatusBadge status={challenge.status} /></div><p className="mt-1 text-sm text-muted-foreground">Started {startDate} · Up to {challenge.matches_per_day} matches per day</p></div><div className="flex gap-2"><Link to={`/challenges/${challenge.id}/analytics`} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"><BarChart3 className="h-4 w-4" />Analytics</Link><Link to={`/challenges/${challenge.id}`} className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">Open<ChevronRight className="h-4 w-4" /></Link></div></div>; })}</CardContent></Card>;
}

function StatusBadge({ status }: { status: Challenge["status"] }) { const style = status === "active" ? "bg-primary/10 text-primary" : status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"; return <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${style}`}>{status}</span>; }

type StatisticsQuery = ReturnType<typeof useChallengeStatistics>;

function AnalyticsSummary({ analyticsHref, statistics, title }: { analyticsHref: string; statistics: StatisticsQuery; title: string }) {
  if (statistics.isPending) return <Card><CardContent className="pt-6 text-sm text-muted-foreground">Calculating analytics…</CardContent></Card>;
  if (statistics.isError) return <Card><CardContent className="pt-6 text-sm text-red-400">Could not calculate analytics.</CardContent></Card>;
  const bestWeapon = statistics.data.weaponScores[0];
  const improvementArea = statistics.data.skillScores.at(-1);
  return <Card className="border-primary/30"><CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle>{title}</CardTitle><CardDescription className="mt-2">A consistent snapshot from the same data used by the full analytics page.</CardDescription></div><Link to={analyticsHref} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"><BarChart3 className="h-4 w-4" />View analytics</Link></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={<Target className="h-5 w-5 text-primary" />} label="Overall K/D" value={statistics.data.overallKd.toFixed(2)} /><Metric icon={<Gamepad2 className="h-5 w-5 text-primary" />} label="Deathmatches" value={String(statistics.data.totalMatches)} /><Metric icon={<TrendingUp className="h-5 w-5 text-primary" />} label="Recent trend" value={`${statistics.data.improvementPercent >= 0 ? "+" : ""}${statistics.data.improvementPercent.toFixed(0)}%`} /><Metric icon={<Sparkles className="h-5 w-5 text-primary" />} label="Focus" value={improvementArea?.name ?? bestWeapon?.name ?? "Record more data"} /></CardContent></Card>;
}

type Overview = NonNullable<ReturnType<typeof useTrainingOverview>["data"]>;

function TrainingCalendar({ days, matches, dailyTarget, currentDayId }: { days: Overview["days"]; matches: Overview["matches"]; dailyTarget: number; currentDayId: string | null }) {
  const matchCounts = new Map<string, number>();
  for (const match of matches) matchCounts.set(match.training_day_id, (matchCounts.get(match.training_day_id) ?? 0) + 1);

  return (
    <Card>
      <CardHeader><CardTitle>Training days</CardTitle><CardDescription>Open any day to add past results or edit records you have already entered.</CardDescription></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {days.map((day) => {
          const count = matchCounts.get(day.id) ?? 0;
          const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${day.date}T00:00:00`));
          return (
            <Link key={day.id} to={`/training/${day.id}`} aria-current={day.id === currentDayId ? "date" : undefined} className={cn("rounded-md border p-4 transition-colors hover:border-primary/60 hover:bg-muted/40", day.id === currentDayId && "border-primary bg-primary/5")}>
              <div className="flex items-center justify-between gap-3"><span className="font-semibold">Day {day.day_number}</span><span className="text-xs text-muted-foreground">{date}</span></div>
              <p className={cn("mt-2 text-sm capitalize", day.status === "completed" ? "text-emerald-400" : "text-muted-foreground")}>{count} / {dailyTarget} maximum matches · {day.status}</p>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

function EmptyChallengeState() {
  return (
    <Card className="mt-8 border-dashed">
      <CardHeader><CardTitle>No active challenge</CardTitle><CardDescription>Configure your schedule and choose the skills you want to practice.</CardDescription></CardHeader>
      <CardContent><Link to="/challenges/new" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Create a challenge</Link></CardContent>
    </Card>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-md border bg-background/40 p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div><p className="mt-3 font-semibold">{value}</p></div>;
}
