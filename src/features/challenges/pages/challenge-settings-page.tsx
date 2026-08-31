import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveChallenge, useDeleteChallenge, useUpdateChallenge } from "@/features/challenges/hooks/use-challenges";
import { challengeSettingsSchema, type ChallengeSettingsValues } from "@/features/challenges/schemas/challenge-settings-schema";

export function ChallengeSettingsPage() {
  const { challengeId = "" } = useParams();
  const activeChallenge = useActiveChallenge();

  if (activeChallenge.isPending) return <p className="text-sm text-muted-foreground">Loading challenge settings…</p>;
  if (activeChallenge.isError) return <p role="alert" className="text-sm text-red-400">Could not load the challenge.</p>;
  if (!activeChallenge.data || activeChallenge.data.id !== challengeId) return <Navigate to="/dashboard" replace />;

  return <ChallengeSettings challenge={activeChallenge.data} />;
}

type Challenge = NonNullable<ReturnType<typeof useActiveChallenge>["data"]>;

function ChallengeSettings({ challenge }: { challenge: Challenge }) {
  const navigate = useNavigate();
  const updateMutation = useUpdateChallenge();
  const deleteMutation = useDeleteChallenge();
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ChallengeSettingsValues>({
    resolver: zodResolver(challengeSettingsSchema),
    defaultValues: { startDate: challenge.start_date },
  });

  const update = async (values: ChallengeSettingsValues) => {
    try {
      await updateMutation.mutateAsync({ challengeId: challenge.id, values });
      reset(values);
    } catch {
      // The mutation state renders the Supabase error below the form.
    }
  };

  const remove = async () => {
    const confirmed = window.confirm("Permanently delete this challenge and all of its training days, matches, notes, and skill evaluations? This cannot be undone.");
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(challenge.id);
      navigate("/dashboard", { replace: true });
    } catch {
      // The mutation state renders the Supabase error below the action.
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
      <Card>
        <CardHeader><CardTitle>Challenge settings</CardTitle><CardDescription>Changing the start date reschedules every generated training day while preserving your recorded data.</CardDescription></CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit(update)}>
            <div className="space-y-2"><Label htmlFor="startDate">Start date</Label><Input id="startDate" type="date" {...register("startDate")} />{errors.startDate?.message && <p className="text-sm text-red-400">{errors.startDate.message}</p>}</div>
            {updateMutation.isError && <p role="alert" className="text-sm text-red-400">{updateMutation.error.message}</p>}
            {updateMutation.isSuccess && <p role="status" className="text-sm text-emerald-400">Challenge updated.</p>}
            <Button type="submit" disabled={!isDirty || updateMutation.isPending}>{updateMutation.isPending ? "Saving…" : "Save changes"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-500/30">
        <CardHeader><CardTitle>Delete challenge</CardTitle><CardDescription>This permanently removes the challenge and all associated training data.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {deleteMutation.isError && <p role="alert" className="text-sm text-red-400">{deleteMutation.error.message}</p>}
          <Button type="button" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={remove} disabled={deleteMutation.isPending}><Trash2 className="mr-2 h-4 w-4" />{deleteMutation.isPending ? "Deleting…" : "Delete challenge"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
