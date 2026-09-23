import { BarChart3, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { useChallenges } from "@/features/challenges/hooks/use-challenges";

export type ChallengeListItem = NonNullable<ReturnType<typeof useChallenges>["data"]>[number];

export function ChallengeList({ challenges, limit, footerHref }: { challenges: ChallengeListItem[]; limit?: number; footerHref?: string }) {
  const visibleChallenges = limit ? challenges.slice(0, limit) : challenges;

  return <Card><CardHeader><CardTitle>Challenges</CardTitle><CardDescription>Active and completed training protocols.</CardDescription></CardHeader><CardContent className="space-y-3">
    {visibleChallenges.length ? visibleChallenges.map((challenge) => {
      const startDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${challenge.start_date}T00:00:00`));
      return <div key={challenge.id} className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4"><div><div className="flex items-center gap-3"><span className="font-semibold">{challenge.duration_days}-day challenge</span><StatusBadge status={challenge.status} /></div><p className="mt-1 text-sm text-muted-foreground">Started {startDate} · Up to {challenge.matches_per_day} matches per day</p></div><div className="flex gap-2"><Link to={`/challenges/${challenge.id}/analytics`} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"><BarChart3 className="h-4 w-4" />Analytics</Link><Link to={`/challenges/${challenge.id}`} className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">Open<ChevronRight className="h-4 w-4" /></Link></div></div>;
    }) : <div className="rounded-md border border-dashed p-8 text-center"><p className="font-medium">No challenges yet</p><p className="mt-2 text-sm text-muted-foreground">Create a challenge to begin tracking your Deathmatch training.</p></div>}
    {footerHref && <div className="flex justify-end border-t pt-4"><Link to={footerHref} className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-semibold hover:bg-muted">View all challenges<ChevronRight className="h-4 w-4" /></Link></div>}
  </CardContent></Card>;
}

function StatusBadge({ status }: { status: ChallengeListItem["status"] }) {
  const style = status === "active" ? "bg-primary/10 text-primary" : status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${style}`}>{status}</span>;
}
