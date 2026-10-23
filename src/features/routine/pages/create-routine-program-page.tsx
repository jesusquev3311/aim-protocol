import { zodResolver } from "@hookform/resolvers/zod";
import { Crosshair, MoveHorizontal } from "lucide-react";
import { useEffect } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveRoutineProgram, useCreateRoutineProgram } from "@/features/routine/hooks/use-routine";
import { routineProgramDurations, routineProgramSchema, type RoutineProgramValues } from "@/features/routine/schemas/routine-program-schema";
import { cn } from "@/lib/utils";

export function CreateRoutineProgramPage() {
  const navigate = useNavigate(); const active = useActiveRoutineProgram(); const mutation = useCreateRoutineProgram();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RoutineProgramValues>({ resolver: zodResolver(routineProgramSchema), defaultValues: { name: "30-Minute Mechanics", startDate: getLocalDate(), durationDays: 15, templateCode: "mechanics_protocol", setsPerSide: null } });
  const template = watch("templateCode");
  useEffect(() => { setValue("setsPerSide", template === "corner_strafe_benchmark" ? 5 : null, { shouldValidate: true }); }, [setValue, template]);
  if (active.isPending) return <p className="text-sm text-muted-foreground">Checking active program…</p>;
  if (active.isError) return <p role="alert" className="text-sm text-red-400">Could not check the active Routine Program. Confirm that the latest Supabase migration has been applied.</p>;
  if (active.data) return <Navigate to={`/routines/${active.data.program.id}`} replace />;
  const submit = async (values: RoutineProgramValues) => { try { const id = await mutation.mutateAsync(values); navigate(`/routines/${id}`, { replace: true }); } catch { /* Feedback below. */ } };
  return <div className="mx-auto max-w-4xl"><Card><CardHeader><CardTitle>Create a Routine Program</CardTitle><CardDescription>Choose a routine type once, then configure the program. Its type cannot be changed after creation.</CardDescription></CardHeader><CardContent><form className="space-y-7" noValidate onSubmit={handleSubmit((values) => void submit(values))}>
    <fieldset className="space-y-3"><legend className="text-sm font-medium">Routine type</legend><div className="grid gap-4 sm:grid-cols-2"><TemplateOption value="mechanics_protocol" selected={template === "mechanics_protocol"} icon={<Crosshair />} title="Routine A · Mechanics Protocol" description="Seven Range exercises, timed training, Deathmatch, habits, and Ranked volume." input={register("templateCode")} /><TemplateOption value="corner_strafe_benchmark" selected={template === "corner_strafe_benchmark"} icon={<MoveHorizontal />} title="Routine B · Corner Strafe Benchmark" description="Timed 100-bot sets from both Range corners, beginning with the Vandal." input={register("templateCode")} /></div></fieldset>
    <Field label="Program name" error={errors.name?.message}><Input {...register("name")} /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Start date" error={errors.startDate?.message}><Input type="date" {...register("startDate")} /></Field><Field label="Program length" error={errors.durationDays?.message}><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...register("durationDays", { valueAsNumber: true })}>{routineProgramDurations.map((duration) => <option key={duration} value={duration}>{duration} routine sessions</option>)}</select></Field></div>
    {template === "corner_strafe_benchmark" && <Field label="100-bot sets per corner" error={errors.setsPerSide?.message}><div className="grid grid-cols-2 gap-3">{[5, 7].map((sets) => <label key={sets} className={cn("cursor-pointer rounded-md border p-4 text-center text-sm font-semibold", watch("setsPerSide") === sets && "border-primary bg-primary/5 text-primary")}><input type="radio" value={sets} className="sr-only" {...register("setsPerSide", { valueAsNumber: true })} />{sets} sets per side<span className="mt-1 block text-xs font-normal text-muted-foreground">{sets * 2} total sets of 100 bots</span></label>)}</div></Field>}
    <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm"><p className="font-medium">Train at your own pace</p><p className="mt-1 text-muted-foreground">Sessions have no scheduled date. The actual date is recorded when you finish each one, and the selected routine type remains fixed.</p></div>{mutation.isError && <p role="alert" className="text-sm text-red-400">{formatCreationError(mutation.error.message)}</p>}<div className="flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => navigate("/routines")}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creating…" : "Create program"}</Button></div>
  </form></CardContent></Card></div>;
}

function TemplateOption({ value, selected, icon, title, description, input }: { value: RoutineProgramValues["templateCode"]; selected: boolean; icon: React.ReactNode; title: string; description: string; input: UseFormRegisterReturn }) { return <label className={cn("cursor-pointer rounded-xl border p-5 transition-colors", selected ? "border-primary bg-primary/5" : "hover:border-primary/40")}><input type="radio" value={value} className="sr-only" {...input} /><span className="text-primary">{icon}</span><span className="mt-3 block font-semibold">{title}</span><span className="mt-2 block text-sm leading-6 text-muted-foreground">{description}</span></label>; }
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}{error && <p className="text-sm text-red-400">{error}</p>}</div>; }
function getLocalDate() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); }
function formatCreationError(message: string) { return message.includes("create_routine_program") || message.includes("schema cache") ? "Routine template setup is missing in Supabase. Apply the latest migration and try again." : message; }
