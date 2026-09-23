import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useChallenge } from "@/features/challenges/hooks/use-challenges";
import { ChallengeCard } from "@/pages/dashboard/dashboard-page";

export function ChallengeDetailPage() {
  const { challengeId = "" } = useParams();
  const query = useChallenge(challengeId);
  if (query.isPending) return <p className="text-sm text-muted-foreground">Loading challenge…</p>;
  if (query.isError) return <p role="alert" className="text-sm text-red-400">Could not load this challenge.</p>;
  return <section><Link to="/challenges" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Challenges</Link><div className="mt-6"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Challenge</p><h1 className="mt-2 text-3xl font-bold">Training protocol</h1></div><ChallengeCard challenge={query.data} /></section>;
}
