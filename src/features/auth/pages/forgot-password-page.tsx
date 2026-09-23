import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendPasswordResetEmail } from "@/features/auth/api/auth";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/features/auth/schemas/auth-schema";

export function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });
  const submit = async (values: ForgotPasswordValues) => {
    setServerError(null);
    try { await sendPasswordResetEmail(values.email); setSent(true); } catch (error) { setServerError(error instanceof Error ? error.message : "No se pudo enviar el correo de recuperación"); }
  };

  return <Card><CardHeader><span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Mail className="h-5 w-5" /></span><CardTitle>Recupera tu contraseña</CardTitle><CardDescription>Te enviaremos un enlace seguro para crear una contraseña nueva.</CardDescription></CardHeader><CardContent>{sent ? <div className="space-y-4"><p role="status" className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">Si existe una cuenta con ese correo, recibirás un enlace de recuperación en unos minutos.</p><p className="text-sm text-muted-foreground">Revisa también la carpeta de spam. El enlace te devolverá a Aim Protocol para elegir una contraseña nueva.</p><Link to="/login" className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold hover:bg-muted">Volver al inicio de sesión</Link></div> : <form className="space-y-4" onSubmit={handleSubmit((values) => void submit(values))}><div className="space-y-2"><Label htmlFor="recovery-email">Email</Label><Input id="recovery-email" type="email" autoComplete="email" {...register("email")} />{errors.email?.message && <p className="text-sm text-red-400">{errors.email.message}</p>}</div>{serverError && <p role="alert" className="text-sm text-red-400">{serverError}</p>}<Button className="w-full" disabled={isSubmitting}>{isSubmitting ? "Enviando…" : "Enviar enlace de recuperación"}</Button><p className="text-center text-sm"><Link className="text-primary hover:underline" to="/login">Volver al inicio de sesión</Link></p></form>}</CardContent></Card>;
}
