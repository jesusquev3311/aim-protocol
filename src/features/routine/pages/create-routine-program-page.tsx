import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveRoutineProgram, useCreateRoutineProgram } from "@/features/routine/hooks/use-routine";
import { routineProgramDurations, routineProgramSchema, type RoutineProgramValues } from "@/features/routine/schemas/routine-program-schema";

export function CreateRoutineProgramPage() {
  const navigate = useNavigate();
  const active = useActiveRoutineProgram();
  const mutation = useCreateRoutineProgram();
  const { register, handleSubmit, formState: { errors } } = useForm<RoutineProgramValues>({ resolver: zodResolver(routineProgramSchema), defaultValues: { name: "30-Minute Mechanics", startDate: getLocalDate(), durationDays: 15 } });
  if (active.isPending) return <p className="text-sm text-muted-foreground">Checking active program…</p>;
  if (active.isError) return <p role="alert" className="text-sm text-red-400">Could not check the active Routine Program. Confirm that the latest Supabase migration has been applied.</p>;
  if (active.data) return <Navigate to={`/routines/${active.data.program.id}`} replace />;
  const submit = async (values: RoutineProgramValues) => { try { const id = await mutation.mutateAsync(values); navigate(`/routines/${id}`, { replace: true }); } catch { /* Feedback below. */ } };

  return <div className="mx-auto max-w-3xl"><Card><CardHeader><CardTitle>Create a Routine Program</CardTitle><CardDescription>Choose when the program begins and how many routine sessions you want to complete at your own pace.</CardDescription></CardHeader><CardContent><form className="space-y-6" noValidate onSubmit={handleSubmit((values) => void submit(values))}><Field label="Program name" error={errors.name?.message}><Input {...register("name")} /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Start date" error={errors.startDate?.message}><Input type="date" {...register("startDate")} /></Field><Field label="Program length" error={errors.durationDays?.message}><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...register("durationDays", { valueAsNumber: true })}>{routineProgramDurations.map((duration) => <option key={duration} value={duration}>{duration} routine sessions</option>)}</select></Field></div><div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm"><p className="font-medium">Train at your own pace</p><p className="mt-1 text-muted-foreground">Routine days have no scheduled calendar date. The actual date is recorded when you finish each session. Start the timer before the Range exercises and use Deathmatch only to complete approximately 30 total minutes.</p></div>{mutation.isError && <p role="alert" className="text-sm text-red-400">{formatCreationError(mutation.error.message)}</p>}<div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => navigate("/routines")}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creating…" : "Create program"}</Button></div></form></CardContent></Card></div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}{error && <p className="text-sm text-red-400">{error}</p>}</div>; }
function getLocalDate() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); }
function formatCreationError(message: string) { return message.includes("create_routine_program") || message.includes("schema cache") ? "Routine Program setup is missing in Supabase. Apply migration 202609230003_create_routine_programs.sql and try again." : message; }
