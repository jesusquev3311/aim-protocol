import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/features/auth/api/auth";
import { resetPasswordSchema, type ResetPasswordValues } from "@/features/auth/schemas/auth-schema";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirmPassword: "" } });
  const submit = async (values: ResetPasswordValues) => {
    setServerError(null);
    try { await resetPassword(values.password); navigate("/dashboard", { replace: true }); } catch (error) { setServerError(error instanceof Error ? error.message : "No se pudo actualizar la contraseña"); }
  };

  if (isLoading) return <p className="text-center text-sm text-muted-foreground">Validando el enlace…</p>;
  if (!session) return <Card><CardHeader><CardTitle>El enlace no es válido</CardTitle><CardDescription>El enlace de recuperación ha caducado o ya se ha utilizado.</CardDescription></CardHeader><CardContent><Link to="/forgot-password" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Solicitar otro enlace</Link></CardContent></Card>;

  return <Card><CardHeader><span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><KeyRound className="h-5 w-5" /></span><CardTitle>Crea una contraseña nueva</CardTitle><CardDescription>Usa al menos 8 caracteres y evita reutilizar una contraseña anterior.</CardDescription></CardHeader><CardContent><form className="space-y-4" onSubmit={handleSubmit((values) => void submit(values))}><PasswordField id="new-password" label="Nueva contraseña" error={errors.password?.message} input={register("password")} /><PasswordField id="confirm-password" label="Confirmar contraseña" error={errors.confirmPassword?.message} input={register("confirmPassword")} />{serverError && <p role="alert" className="text-sm text-red-400">{serverError}</p>}<Button className="w-full" disabled={isSubmitting}>{isSubmitting ? "Actualizando…" : "Guardar contraseña"}</Button></form></CardContent></Card>;
}

function PasswordField({ id, label, error, input }: { id: string; label: string; error?: string; input: UseFormRegisterReturn }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type="password" autoComplete="new-password" {...input} />{error && <p className="text-sm text-red-400">{error}</p>}</div>;
}
