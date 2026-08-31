import { ArrowLeft, CheckCircle2, Circle, Pencil } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DayNotesForm } from "@/features/training/components/day-notes-form";
import { DeathmatchForm } from "@/features/training/components/deathmatch-form";
import { SkillEvaluations } from "@/features/training/components/skill-evaluations";
import { useSetTrainingDayStatus, useTrainingDay } from "@/features/training/hooks/use-training";
import { calculateAverageKd, calculateKd } from "@/features/training/lib/training-calculations";

export function TrainingDayPage() {
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const { trainingDayId = "" } = useParams();
  const query = useTrainingDay(trainingDayId);
  const statusMutation = useSetTrainingDayStatus();
  if (!trainingDayId) return <p role="alert" className="text-sm text-red-400">Invalid training day.</p>;
  if (query.isPending) return <p className="text-sm text-muted-foreground">Loading training day…</p>;
  if (query.isError) return <p role="alert" className="text-sm text-red-400">Could not load this training day.</p>;

  const { day, challenge, matches, skills, skillResults } = query.data;
  const nextMatchNumber = matches.length + 1;
  const dailyKd = calculateAverageKd(matches);
  const targetReached = matches.length >= challenge.matches_per_day;
  const isOpen = day.status === "pending";
  const trainingDate = new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(`${day.date}T00:00:00`));

  return (
    <div className="space-y-8">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
      <div><div className="flex flex-wrap items-center gap-3"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Training day</p><DayStatusBadge status={day.status} /></div><h1 className="mt-2 text-3xl font-bold">Day {day.day_number} of {challenge.duration_days}</h1><p className="mt-2 text-muted-foreground">{trainingDate} · {matches.length} of {challenge.matches_per_day} matches recorded · Average K/D {dailyKd.toFixed(2)}</p></div>

      <Card><CardHeader><CardTitle>Deathmatches</CardTitle><CardDescription>Record kills and deaths; K/D is calculated automatically.</CardDescription></CardHeader><CardContent className="space-y-4">
        {matches.map((match) => editingMatchId === match.id ? (
          <div key={match.id} className="rounded-md border border-primary/40 p-5"><DeathmatchForm trainingDayId={day.id} challengeId={day.challenge_id} matchNumber={match.match_number} recommendedMode={challenge.recommended_mode} existingMatch={{ id: match.id, kills: match.kills, deaths: match.deaths, weapon: match.weapon, rating: match.rating, notes: match.notes ?? "" }} onCancel={() => setEditingMatchId(null)} /></div>
        ) : (
          <div key={match.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4"><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-400" /><div><p className="font-medium">Match {match.match_number} · {match.weapon}</p><p className="text-sm capitalize text-muted-foreground">{match.rating}{match.notes ? ` · ${match.notes}` : ""}</p></div></div><div className="flex items-center gap-4"><div className="text-right"><p className="font-semibold">{match.kills} / {match.deaths}</p><p className="text-sm text-muted-foreground">K/D {calculateKd(match).toFixed(2)}</p></div><button type="button" onClick={() => setEditingMatchId(match.id)} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"><Pencil className="h-4 w-4" />Edit</button></div></div>
        ))}
        {!targetReached && isOpen && !editingMatchId && <div className="rounded-md border border-dashed p-5"><DeathmatchForm trainingDayId={day.id} challengeId={day.challenge_id} matchNumber={nextMatchNumber} recommendedMode={challenge.recommended_mode} /></div>}
        {day.status === "completed" && <div className="flex items-center gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"><CheckCircle2 className="h-5 w-5" />Daily target complete.</div>}
        {day.status === "partial" && <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300"><span>Day finished early with {matches.length} of {challenge.matches_per_day} matches.</span><Button type="button" variant="outline" size="sm" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ trainingDayId: day.id, challengeId: day.challenge_id, status: "pending" })}>Reopen day</Button></div>}
        {day.status === "pending" && matches.length > 0 && !targetReached && <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm text-muted-foreground">Cannot play the full target today?</p><Button type="button" variant="outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ trainingDayId: day.id, challengeId: day.challenge_id, status: "partial" })}>{statusMutation.isPending ? "Finishing…" : `Finish day with ${matches.length}/${challenge.matches_per_day}`}</Button></div>}
        {statusMutation.isError && <p role="alert" className="text-sm text-red-400">{statusMutation.error.message}</p>}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Skill evaluation</CardTitle><CardDescription>Evaluate the mechanics selected for this challenge.</CardDescription></CardHeader><CardContent>{skills.length ? <SkillEvaluations trainingDayId={day.id} skills={skills} results={skillResults} /> : <p className="flex items-center gap-2 text-sm text-muted-foreground"><Circle className="h-4 w-4" />No skills selected.</p>}</CardContent></Card>
      <Card><CardContent className="pt-6"><DayNotesForm trainingDayId={day.id} initialNotes={day.notes} /></CardContent></Card>
    </div>
  );
}

function DayStatusBadge({ status }: { status: "pending" | "partial" | "completed" }) {
  const styles = status === "completed" ? "bg-emerald-500/10 text-emerald-400" : status === "partial" ? "bg-amber-500/10 text-amber-400" : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles}`}>{status}</span>;
}
