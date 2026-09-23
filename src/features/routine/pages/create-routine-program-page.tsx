import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveRoutineProgram, useCreateRoutineProgram } from "@/features/routine/hooks/use-routine";
import { routineProgramDurations, routineProgramSchema, weekdayOptions, type RoutineProgramValues } from "@/features/routine/schemas/routine-program-schema";

export function CreateRoutineProgramPage() {
  const navigate = useNavigate();
  const active = useActiveRoutineProgram();
  const mutation = useCreateRoutineProgram();
  const { register, handleSubmit, formState: { errors } } = useForm<RoutineProgramValues>({ resolver: zodResolver(routineProgramSchema), defaultValues: { name: "30-Minute Mechanics", startDate: getLocalDate(), durationDays: 15, weekdays: [1, 2, 3, 4, 5, 6, 7] } });
  if (active.isPending) return <p className="text-sm text-muted-foreground">Checking active program…</p>;
  if (active.data) return <Navigate to={`/routines/${active.data.program.id}`} replace />;
  const submit = async (values: RoutineProgramValues) => { try { const id = await mutation.mutateAsync(values); navigate(`/routines/${id}`, { replace: true }); } catch { /* Feedback below. */ } };

  return <div className="mx-auto max-w-3xl"><Card><CardHeader><CardTitle>Create a Routine Program</CardTitle><CardDescription>Choose a finite training window and the weekdays on which the routine repeats.</CardDescription></CardHeader><CardContent><form className="space-y-6" onSubmit={handleSubmit((values) => void submit(values))}><Field label="Program name" error={errors.name?.message}><Input {...register("name")} /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Start date" error={errors.startDate?.message}><Input type="date" {...register("startDate")} /></Field><Field label="Duration" error={errors.durationDays?.message}><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...register("durationDays", { valueAsNumber: true })}>{routineProgramDurations.map((duration) => <option key={duration} value={duration}>{duration} calendar days</option>)}</select></Field></div><div className="space-y-3"><div><Label>Training weekdays</Label><p className="mt-1 text-xs text-muted-foreground">The schedule repeats on these weekdays during the selected program duration.</p></div><div className="grid gap-2 sm:grid-cols-4">{weekdayOptions.map((day) => <label key={day.value} className="flex items-center gap-2 rounded-md border p-3 text-sm"><input type="checkbox" value={day.value} className="h-4 w-4 accent-[hsl(var(--primary))]" {...register("weekdays", { valueAsNumber: true })} />{day.label}</label>)}</div>{errors.weekdays?.message && <p className="text-sm text-red-400">{errors.weekdays.message}</p>}</div><div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm"><p className="font-medium">How timing works</p><p className="mt-1 text-muted-foreground">Start the timer before the Range exercises. Play Deathmatch only after the drills, stopping when the complete training session reaches approximately 30 minutes.</p></div>{mutation.isError && <p role="alert" className="text-sm text-red-400">{mutation.error.message}</p>}<div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => navigate("/routines")}>Cancel</Button><Button disabled={mutation.isPending}>{mutation.isPending ? "Creating…" : "Create program"}</Button></div></form></CardContent></Card></div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}{error && <p className="text-sm text-red-400">{error}</p>}</div>; }
function getLocalDate() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); }
