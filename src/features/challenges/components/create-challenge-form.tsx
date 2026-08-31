import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateChallenge, useSkills } from "@/features/challenges/hooks/use-challenges";
import { challengeDurations, createChallengeSchema, matchesPerDayOptions, type CreateChallengeValues } from "@/features/challenges/schemas/challenge-schema";
import { cn } from "@/lib/utils";

function getLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function CreateChallengeForm() {
  const navigate = useNavigate();
  const skillsQuery = useSkills();
  const createMutation = useCreateChallenge();
  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateChallengeValues>({
    resolver: zodResolver(createChallengeSchema),
    defaultValues: {
      durationDays: 20,
      matchesPerDay: 5,
      startDate: getLocalDate(),
      recommendedMode: true,
      skillIds: [],
    },
  });
  const selectedSkillIds = watch("skillIds");

  const toggleSkill = (skillId: number) => {
    const next = selectedSkillIds.includes(skillId)
      ? selectedSkillIds.filter((id) => id !== skillId)
      : [...selectedSkillIds, skillId];
    setValue("skillIds", next, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = async (values: CreateChallengeValues) => {
    try {
      await createMutation.mutateAsync(values);
      navigate("/dashboard", { replace: true });
    } catch {
      // The mutation state renders the Supabase error below the form.
    }
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="durationDays">Duration</Label>
          <select id="durationDays" className="flex h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" {...register("durationDays", { valueAsNumber: true })}>
            {challengeDurations.map((duration) => <option key={duration} value={duration}>{duration} days</option>)}
          </select>
          <FieldError message={errors.durationDays?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          <FieldError message={errors.startDate?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="matchesPerDay">Deathmatches per day</Label>
        <Controller
          control={control}
          name="matchesPerDay"
          render={({ field }) => (
            <select
              ref={field.ref}
              id="matchesPerDay"
              name={field.name}
              value={field.value}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(Number(event.target.value))}
              className="flex h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {matchesPerDayOptions.map((count) => <option key={count} value={count}>{count} {count === 1 ? "match" : "matches"}</option>)}
            </select>
          )}
        />
        <p className="text-sm text-muted-foreground">Choose a realistic daily target between 1 and 10.</p>
        <FieldError message={errors.matchesPerDay?.message} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Skills to practice</legend>
        {skillsQuery.isPending && <p className="text-sm text-muted-foreground">Loading skills…</p>}
        {skillsQuery.isError && <p role="alert" className="text-sm text-red-400">Could not load skills. Try again.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {skillsQuery.data?.map((skill) => {
            const selected = selectedSkillIds.includes(skill.id);
            return <button key={skill.id} type="button" aria-pressed={selected} onClick={() => toggleSkill(skill.id)} className={cn("rounded-md border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", selected && "border-primary bg-primary/10 text-primary")}>{skill.name}</button>;
          })}
        </div>
        <FieldError message={errors.skillIds?.message} />
      </fieldset>

      <label className="flex items-start gap-3 rounded-md border p-4">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" {...register("recommendedMode")} />
        <span><span className="block text-sm font-medium">Recommended weapon routine</span><span className="mt-1 block text-sm text-muted-foreground">Sheriff for matches 1–2, Guardian for matches 3–4, then Vandal or Phantom.</span></span>
      </label>

      {createMutation.isError && <p role="alert" className="text-sm text-red-400">{createMutation.error.message}</p>}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => navigate("/dashboard")}>Cancel</Button>
        <Button type="submit" disabled={createMutation.isPending || skillsQuery.isPending}>{createMutation.isPending ? "Creating…" : "Create challenge"}</Button>
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-red-400">{message}</p> : null;
}
