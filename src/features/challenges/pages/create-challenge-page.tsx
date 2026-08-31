import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateChallengeForm } from "@/features/challenges/components/create-challenge-form";
import { useActiveChallenge } from "@/features/challenges/hooks/use-challenges";
import { Navigate } from "react-router-dom";

export function CreateChallengePage() {
  const activeChallenge = useActiveChallenge();
  if (activeChallenge.isPending) return <p className="text-sm text-muted-foreground">Checking your challenges…</p>;
  if (activeChallenge.isError) return <p role="alert" className="text-sm text-red-400">Could not check your active challenge. Try refreshing the page.</p>;
  if (activeChallenge.data) return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader><CardTitle>Create your challenge</CardTitle><CardDescription>Choose a training schedule and the mechanics you want to improve.</CardDescription></CardHeader>
        <CardContent><CreateChallengeForm /></CardContent>
      </Card>
    </div>
  );
}
