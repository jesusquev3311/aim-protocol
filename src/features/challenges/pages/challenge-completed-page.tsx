import { Award, BarChart3, PartyPopper, RotateCcw } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChallengeAchievements } from "@/features/achievements/hooks/use-achievements";
import { useChallenge, useResetChallenge } from "@/features/challenges/hooks/use-challenges";
import { useChallengeStatistics } from "@/features/statistics/hooks/use-statistics";

export function ChallengeCompletedPage() {
  const { challengeId = "" } = useParams();
  const navigate = useNavigate();
  const challenge = useChallenge(challengeId);
  const stats = useChallengeStatistics(challengeId);
  const achievements = useChallengeAchievements(challengeId);
  const resetMutation = useResetChallenge();
  if (challenge.isPending || stats.isPending || achievements.isPending) return <p className="text-sm text-muted-foreground">Preparing your results…</p>;
  if (challenge.isError || stats.isError || achievements.isError) return <p role="alert" className="text-sm text-red-400">Could not load challenge results.</p>;
  if (challenge.data.status !== "completed") return <p className="text-muted-foreground">Complete every training day to unlock this result screen.</p>;

  const reset = async () => {
    const confirmed = window.confirm("Reset this completed challenge? All matches, evaluations, notes, completion dates, and achievements will be permanently erased. This cannot be undone.");
    if (!confirmed) return;
    try { await resetMutation.mutateAsync(challengeId); navigate("/dashboard"); } catch { /* Mutation feedback is shown below. */ }
  };

  return <section className="space-y-8"><div className="rounded-xl border border-primary/40 bg-primary/10 p-8 text-center"><PartyPopper className="mx-auto h-10 w-10 text-primary" /><p className="mt-4 text-sm font-semibold uppercase tracking-widest text-primary">Challenge finished</p><h1 className="mt-2 text-4xl font-bold">You completed {stats.data.completedDays} of {challenge.data.duration_days} training days</h1><p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Your completed dates, match volume, and performance data are saved for review.</p></div>
    <div className="grid gap-4 sm:grid-cols-3"><Result label="Deathmatches played" value={String(stats.data.totalMatches)} /><Result label="Overall K/D" value={stats.data.overallKd.toFixed(2)} /><Result label="Kills recorded" value={String(stats.data.totalKills)} /></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-6 w-6 text-primary" />Achievements unlocked</CardTitle><CardDescription>Milestones earned during this challenge.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{achievements.data.map((achievement) => <div key={achievement.code} className="rounded-lg border bg-background/40 p-5"><Award className="h-7 w-7 text-primary" aria-hidden="true" /><h2 className="mt-3 font-semibold">{achievement.name}</h2><p className="mt-1 text-sm text-muted-foreground">{achievement.description}</p></div>)}</CardContent></Card>
    <div className="space-y-3 text-center"><div className="flex flex-wrap justify-center gap-3"><Link to={`/challenges/${challengeId}/analytics`} className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"><BarChart3 className="h-4 w-4" />Explore analytics</Link><Link to="/challenges/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"><RotateCcw className="h-4 w-4" />Start another challenge</Link><button type="button" onClick={() => void reset()} disabled={resetMutation.isPending} className="inline-flex h-10 items-center gap-2 rounded-md border border-amber-500/50 px-4 text-sm font-semibold text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"><RotateCcw className="h-4 w-4" />{resetMutation.isPending ? "Resetting…" : "Reset challenge"}</button></div>{resetMutation.isError && <p role="alert" className="text-sm text-red-400">{resetMutation.error.message}</p>}</div>
  </section>;
}

function Result({ label, value }: { label: string; value: string }) { return <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></CardContent></Card>; }
