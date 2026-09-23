import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { ChallengeList } from "@/features/challenges/components/challenge-list";
import { useChallenges } from "@/features/challenges/hooks/use-challenges";

export function ChallengeListPage() {
  const query = useChallenges();
  if (query.isPending) return <p className="text-sm text-muted-foreground">Loading challenges…</p>;
  if (query.isError) return <p role="alert" className="text-sm text-red-400">Could not load your challenges. Try refreshing the page.</p>;
  const hasActiveChallenge = query.data.some((challenge) => challenge.status === "active");

  return <section className="space-y-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Challenges</p><h1 className="mt-2 text-3xl font-bold">Training challenges</h1><p className="mt-2 text-muted-foreground">Review every protocol or start a new challenge when no challenge is active.</p></div>{hasActiveChallenge ? <span className="rounded-md border px-4 py-2 text-sm text-muted-foreground">Finish or abandon the active challenge to create another</span> : <Link to="/challenges/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New challenge</Link>}</div><ChallengeList challenges={query.data} /></section>;
}
