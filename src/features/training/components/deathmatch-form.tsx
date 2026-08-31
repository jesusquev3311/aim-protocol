import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddDeathmatch, useUpdateDeathmatch } from "@/features/training/hooks/use-training";
import { deathmatchRatings, deathmatchSchema, weaponOptions, type DeathmatchValues } from "@/features/training/schemas/deathmatch-schema";
import { getRecommendedWeapon } from "@/features/training/lib/training-calculations";

type DeathmatchFormProps = {
  trainingDayId: string;
  challengeId: string;
  matchNumber: number;
  recommendedMode: boolean;
  existingMatch?: DeathmatchValues & { id: string };
  onCancel?: () => void;
};

function defaultWeapon(matchNumber: number) {
  const recommendation = getRecommendedWeapon(matchNumber);
  return recommendation === "Vandal or Phantom" ? "Vandal" : recommendation;
}

export function DeathmatchForm({ trainingDayId, challengeId, matchNumber, recommendedMode, existingMatch, onCancel }: DeathmatchFormProps) {
  const addMutation = useAddDeathmatch(trainingDayId, challengeId);
  const updateMutation = useUpdateDeathmatch(trainingDayId, challengeId);
  const mutation = existingMatch ? updateMutation : addMutation;
  const fieldSuffix = existingMatch?.id ?? "new";
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DeathmatchValues>({
    resolver: zodResolver(deathmatchSchema),
    defaultValues: existingMatch ?? { kills: 0, deaths: 0, weapon: defaultWeapon(matchNumber), rating: "average", notes: "" },
  });

  const onSubmit = async (values: DeathmatchValues) => {
    try {
      if (existingMatch) {
        await updateMutation.mutateAsync({ ...values, trainingDayId, deathmatchId: existingMatch.id });
        onCancel?.();
      } else {
        await addMutation.mutateAsync({ ...values, trainingDayId, matchNumber });
        reset({ kills: 0, deaths: 0, weapon: defaultWeapon(matchNumber + 1), rating: "average", notes: "" });
      }
    } catch {
      // The mutation state renders the Supabase error below the form.
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">{existingMatch ? "Edit" : "Add"} match {matchNumber}</h2>{recommendedMode && !existingMatch && <p className="mt-1 text-sm text-muted-foreground">Recommended: {getRecommendedWeapon(matchNumber)}</p>}</div></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2"><Label htmlFor={`kills-${fieldSuffix}`}>Kills</Label><Input id={`kills-${fieldSuffix}`} type="number" min={0} {...register("kills", { valueAsNumber: true })} /><FieldError message={errors.kills?.message} /></div>
        <div className="space-y-2"><Label htmlFor={`deaths-${fieldSuffix}`}>Deaths</Label><Input id={`deaths-${fieldSuffix}`} type="number" min={0} {...register("deaths", { valueAsNumber: true })} /><FieldError message={errors.deaths?.message} /></div>
        <div className="space-y-2"><Label htmlFor={`weapon-${fieldSuffix}`}>Weapon</Label><select id={`weapon-${fieldSuffix}`} className="flex h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...register("weapon")}>{weaponOptions.map((weapon) => <option key={weapon}>{weapon}</option>)}</select><FieldError message={errors.weapon?.message} /></div>
      </div>
      <fieldset className="space-y-2"><legend className="text-sm font-medium">How did the match feel?</legend><div className="flex flex-wrap gap-4">{deathmatchRatings.map((rating) => <label key={rating} className="flex items-center gap-2 text-sm capitalize"><input type="radio" value={rating} className="accent-[hsl(var(--primary))]" {...register("rating")} />{rating}</label>)}</div><FieldError message={errors.rating?.message} /></fieldset>
      <div className="space-y-2"><Label htmlFor={`match-notes-${fieldSuffix}`}>Notes <span className="text-muted-foreground">(optional)</span></Label><textarea id={`match-notes-${fieldSuffix}`} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" {...register("notes")} /><FieldError message={errors.notes?.message} /></div>
      {mutation.isError && <p role="alert" className="text-sm text-red-400">{mutation.error.message}</p>}
      <div className="flex gap-3">{existingMatch && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}<Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : existingMatch ? "Save changes" : "Save match"}</Button></div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-red-400">{message}</p> : null;
}
