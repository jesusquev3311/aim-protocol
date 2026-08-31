import { useSaveSkillResult } from "@/features/training/hooks/use-training";
import { deathmatchRatings, type SkillResult } from "@/features/training/schemas/deathmatch-schema";
import { cn } from "@/lib/utils";

type Skill = { id: number; name: string };
type ExistingResult = { skill_id: number; result: SkillResult };

export function SkillEvaluations({ trainingDayId, skills, results }: { trainingDayId: string; skills: Skill[]; results: ExistingResult[] }) {
  const mutation = useSaveSkillResult(trainingDayId);

  const save = (skillId: number, result: SkillResult) => {
    mutation.mutate({ trainingDayId, skillId, result });
  };

  return (
    <div className="space-y-4">
      {skills.map((skill) => {
        const current = results.find((result) => result.skill_id === skill.id)?.result;
        return (
          <div key={skill.id} className="flex flex-col justify-between gap-3 rounded-md border p-4 sm:flex-row sm:items-center">
            <p className="text-sm font-medium">{skill.name}</p>
            <div className="flex gap-2">{deathmatchRatings.map((result) => <button key={result} type="button" disabled={mutation.isPending} onClick={() => save(skill.id, result)} className={cn("rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors", current === result && "border-primary bg-primary/10 text-primary")}>{result}</button>)}</div>
          </div>
        );
      })}
      {mutation.isError && <p role="alert" className="text-sm text-red-400">{mutation.error.message}</p>}
    </div>
  );
}
