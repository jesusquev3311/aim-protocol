import { ArrowLeft, Award, LockKeyhole } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChallengeAchievementProgress } from "@/features/achievements/hooks/use-achievements";
import { useChallenge } from "@/features/challenges/hooks/use-challenges";
import { useChallengeStatistics } from "@/features/statistics/hooks/use-statistics";
import { StatisticsContent } from "@/features/statistics/pages/statistics-page";

export function ChallengeStatisticsPage() {
  const { challengeId = "" } = useParams();
  const challenge = useChallenge(challengeId);
  const statistics = useChallengeStatistics(challengeId);
  const achievements = useChallengeAchievementProgress(challengeId);
  if (challenge.isPending || statistics.isPending || achievements.isPending) return <p className="text-sm text-muted-foreground">Analyzing this challenge…</p>;
  if (challenge.isError || statistics.isError || achievements.isError) return <p role="alert" className="text-sm text-red-400">Could not load challenge analytics.</p>;
  const startDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${challenge.data.start_date}T00:00:00`));
  const unlockedCount = achievements.data.filter((achievement) => achievement.unlockedAt).length;
  return <div className="space-y-6"><Link to={`/challenges/${challengeId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Challenge</Link><StatisticsContent stats={statistics.data} title={`${challenge.data.duration_days}-day challenge`} description={`Performance for the challenge started ${startDate}. No other challenge data is included.`} /><Card><CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-6 w-6 text-primary" />Achievements</CardTitle><CardDescription>{unlockedCount} of {achievements.data.length} unlocked in this challenge.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{achievements.data.map((achievement) => { const unlocked = Boolean(achievement.unlockedAt); return <article key={achievement.code} className={`rounded-lg border p-5 ${unlocked ? "border-primary/40 bg-primary/5" : "bg-muted/20 opacity-65"}`}><div className="flex items-center justify-between"><span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{unlocked ? <Award className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}</span><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{unlocked ? "Unlocked" : "To complete"}</span></div><h2 className="mt-4 font-semibold">{achievement.name}</h2><p className="mt-1 text-sm text-muted-foreground">{achievement.description}</p>{achievement.unlockedAt && <p className="mt-3 text-xs text-primary">Unlocked {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(achievement.unlockedAt))}</p>}</article>; })}</CardContent></Card></div>;
}
