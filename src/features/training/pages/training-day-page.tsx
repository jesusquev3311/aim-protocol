import { ArrowLeft, CheckCircle2, Circle, PartyPopper, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DayNotesForm } from "@/features/training/components/day-notes-form";
import { DeathmatchForm } from "@/features/training/components/deathmatch-form";
import { SkillEvaluations } from "@/features/training/components/skill-evaluations";
import { useSetTrainingDayStatus, useTrainingDay } from "@/features/training/hooks/use-training";
import { calculateAverageKd, calculateKd } from "@/features/training/lib/training-calculations";

export function TrainingDayPage() {
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { trainingDayId = "" } = useParams();
  const query = useTrainingDay(trainingDayId);
  const statusMutation = useSetTrainingDayStatus();
  const previousChallengeStatus = useRef<"active" | "completed" | "abandoned" | null>(null);

  useEffect(() => {
    const data = query.data;
    const status = data?.challenge.status;
    if (data && previousChallengeStatus.current === "active" && status === "completed") {
      void navigate(`/challenges/${data.challenge.id}/completed`);
    }
    if (status) previousChallengeStatus.current = status;
  }, [navigate, query.data]);
  if (!trainingDayId) return <p role="alert" className="text-sm text-red-400">Invalid training day.</p>;
  if (query.isPending) return <p className="text-sm text-muted-foreground">Loading training day…</p>;
  if (query.isError) return <p role="alert" className="text-sm text-red-400">Could not load this training day.</p>;

  const { day, challenge, matches, skills, skillResults } = query.data;
  const nextMatchNumber = matches.length + 1;
  const dailyKd = calculateAverageKd(matches);
  const targetReached = matches.length >= challenge.matches_per_day;
  const canAddMatch = !targetReached;
  const trainingDate = new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(`${day.date}T00:00:00`));

  return (
    <div className="space-y-8">
      <Link to={`/challenges/${day.challenge_id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Challenge</Link>
      <div><div className="flex flex-wrap items-center gap-3"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Training day</p><DayStatusBadge status={day.status} /></div><h1 className="mt-2 text-3xl font-bold">Day {day.day_number} of {challenge.duration_days}</h1><p className="mt-2 text-muted-foreground">{trainingDate} · {matches.length} of {challenge.matches_per_day} maximum matches recorded · Average K/D {dailyKd.toFixed(2)}</p>{day.completed_at && <p className="mt-1 text-sm text-muted-foreground">Completed {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(day.completed_at))}</p>}</div>

      {challenge.status === "completed" && <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/40 bg-primary/10 p-5"><div className="flex items-center gap-3"><PartyPopper className="h-6 w-6 text-primary" /><div><p className="font-semibold">Challenge completed</p><p className="text-sm text-muted-foreground">Your results and achievements are ready.</p></div></div><Link to={`/challenges/${challenge.id}/completed`} className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">View results</Link></div>}

      <Card><CardHeader><CardTitle>Deathmatches</CardTitle><CardDescription>Record kills and deaths; K/D is calculated automatically.</CardDescription></CardHeader><CardContent className="space-y-4">
        {matches.map((match) => editingMatchId === match.id ? (
          <div key={match.id} className="rounded-md border border-primary/40 p-5"><DeathmatchForm trainingDayId={day.id} challengeId={day.challenge_id} matchNumber={match.match_number} recommendedMode={challenge.recommended_mode} existingMatch={{ id: match.id, kills: match.kills, deaths: match.deaths, weapon: match.weapon, rating: match.rating, notes: match.notes ?? "" }} onCancel={() => setEditingMatchId(null)} /></div>
        ) : (
          <div key={match.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-400" /><div><p className="font-medium">Match {match.match_number} · {match.weapon}</p><p className="text-sm capitalize text-muted-foreground">{match.rating}{match.notes ? ` · ${match.notes}` : ""}</p></div></div><div className="flex items-center gap-4"><div className="text-right"><p className="font-semibold">{match.kills} / {match.deaths}</p><p className="text-sm text-muted-foreground">K/D {calculateKd(match).toFixed(2)}</p></div><button type="button" onClick={() => setEditingMatchId(match.id)} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"><Pencil className="h-4 w-4" />Edit</button></div></div>
        ))}
        {canAddMatch && !editingMatchId && <div className="rounded-md border border-dashed p-5"><p className="mb-4 text-sm text-muted-foreground">{day.status === "completed" ? "This day is complete, but you can still add matches up to your daily maximum." : "Record another Deathmatch when you are ready."}</p><DeathmatchForm trainingDayId={day.id} challengeId={day.challenge_id} matchNumber={nextMatchNumber} recommendedMode={challenge.recommended_mode} /></div>}
        {day.status === "completed" && <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"><span className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5" />Day complete with {matches.length} recorded {matches.length === 1 ? "match" : "matches"}.</span>{challenge.status === "active" && !targetReached && <Button type="button" variant="outline" size="sm" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ trainingDayId: day.id, challengeId: day.challenge_id, status: "pending" })}>Reopen day</Button>}</div>}
        {day.status === "pending" && matches.length > 0 && !targetReached && <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm text-muted-foreground">Finished training for this day?</p><Button type="button" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ trainingDayId: day.id, challengeId: day.challenge_id, status: "completed" })}>{statusMutation.isPending ? "Completing…" : `Complete day with ${matches.length} ${matches.length === 1 ? "match" : "matches"}`}</Button></div>}
        {statusMutation.isError && <p role="alert" className="text-sm text-red-400">{statusMutation.error.message}</p>}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Skill evaluation</CardTitle><CardDescription>Evaluate the mechanics selected for this challenge.</CardDescription></CardHeader><CardContent>{skills.length ? <SkillEvaluations trainingDayId={day.id} skills={skills} results={skillResults} /> : <p className="flex items-center gap-2 text-sm text-muted-foreground"><Circle className="h-4 w-4" />No skills selected.</p>}</CardContent></Card>
      <Card><CardContent className="pt-6"><DayNotesForm trainingDayId={day.id} initialNotes={day.notes} /></CardContent></Card>
    </div>
  );
}

function DayStatusBadge({ status }: { status: "pending" | "completed" }) {
  const styles = status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles}`}>{status}</span>;
}
