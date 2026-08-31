import { CalendarDays, Gamepad2, Settings, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveChallenge } from "@/features/challenges/hooks/use-challenges";
import { useTrainingOverview } from "@/features/training/hooks/use-training";
import { calculateAverageKd, getCurrentTrainingDay } from "@/features/training/lib/training-calculations";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const activeChallenge = useActiveChallenge();

  if (activeChallenge.isPending) {
    return <p className="text-sm text-muted-foreground">Loading your dashboard…</p>;
  }

  if (activeChallenge.isError) {
    return <p role="alert" className="text-sm text-red-400">Could not load your challenge. Try refreshing the page.</p>;
  }

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">Dashboard</p>
      <h1 className="mt-2 text-3xl font-bold">Your training starts here</h1>
      {activeChallenge.data ? <ActiveChallengeCard challenge={activeChallenge.data} /> : <EmptyChallengeState />}
    </section>
  );
}

type ActiveChallenge = NonNullable<ReturnType<typeof useActiveChallenge>["data"]>;

function ActiveChallengeCard({ challenge }: { challenge: ActiveChallenge }) {
  const overview = useTrainingOverview(challenge.id);
  const startDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${challenge.start_date}T00:00:00`));
  const currentDay = overview.data ? getCurrentTrainingDay(overview.data.days) : null;
  const currentMatches = currentDay ? overview.data?.matches.filter((match) => match.training_day_id === currentDay.id) ?? [] : [];
  const completedMatches = overview.data?.matches.length ?? 0;
  const totalMatches = challenge.duration_days * challenge.matches_per_day;
  const progress = totalMatches === 0 ? 0 : Math.round((completedMatches / totalMatches) * 100);

  return (
    <div className="mt-8 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle>Active challenge</CardTitle><CardDescription className="mt-2">{challenge.duration_days} days starting {startDate}</CardDescription></div><Link to={`/challenges/${challenge.id}/settings`} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"><Settings className="h-4 w-4" />Settings</Link></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric icon={<CalendarDays className="h-5 w-5 text-primary" />} label="Current day" value={currentDay ? `Day ${currentDay.day_number}` : "Preparing…"} />
            <Metric icon={<Gamepad2 className="h-5 w-5 text-primary" />} label="Today's matches" value={`${currentMatches.length} / ${challenge.matches_per_day}`} />
            <Metric icon={<Target className="h-5 w-5 text-primary" />} label="Today's average K/D" value={calculateAverageKd(currentMatches).toFixed(2)} />
          </div>
          <div><div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">Total progress</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-5"><div className="flex gap-5 text-sm text-muted-foreground"><span>{overview.data?.days.filter((day) => day.status !== "pending").length ?? 0} days closed</span><span className="flex items-center gap-1"><Sparkles className="h-4 w-4" />Recommended mode {challenge.recommended_mode ? "on" : "off"}</span></div>{currentDay && <Link to={`/training/${currentDay.id}`} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Open today's training</Link>}</div>
          {overview.isError && <p role="alert" className="text-sm text-red-400">Could not load training progress.</p>}
        </CardContent>
      </Card>
      {overview.data && <TrainingCalendar days={overview.data.days} matches={overview.data.matches} dailyTarget={challenge.matches_per_day} currentDayId={currentDay?.id ?? null} />}
    </div>
  );
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
              <p className={cn("mt-2 text-sm capitalize", day.status === "completed" ? "text-emerald-400" : day.status === "partial" ? "text-amber-400" : "text-muted-foreground")}>{count} / {dailyTarget} matches · {day.status}</p>
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
