import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUpdateTrainingDayNotes } from "@/features/training/hooks/use-training";

export function DayNotesForm({ trainingDayId, initialNotes }: { trainingDayId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const mutation = useUpdateTrainingDayNotes(trainingDayId);

  useEffect(() => setNotes(initialNotes ?? ""), [initialNotes]);

  return (
    <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); mutation.mutate({ trainingDayId, notes }); }}>
      <Label htmlFor="dayNotes">Daily notes</Label>
      <textarea id="dayNotes" rows={4} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="What worked well? What should you focus on tomorrow?" />
      {mutation.isError && <p role="alert" className="text-sm text-red-400">{mutation.error.message}</p>}
      <Button type="submit" variant="outline" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save notes"}</Button>
    </form>
  );
}
