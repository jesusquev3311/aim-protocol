import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/features/auth/api/auth";
import { loginSchema, registerSchema, type LoginValues, type RegisterValues } from "@/features/auth/schemas/auth-schema";

type AuthFormProps = { mode: "login" | "register" };

export function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const isRegister = mode === "register";
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
    defaultValues: { email: "", password: "", username: "" },
  });

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null);
    try {
      if (isRegister) await signUp(values);
      else await signIn(values as LoginValues);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Ha ocurrido un error inesperado");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {isRegister && <div className="space-y-2"><Label htmlFor="username">Nombre de jugador</Label><Input id="username" autoComplete="username" {...register("username")} /><FieldError message={errors.username?.message} /></div>}
      <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" {...register("email")} /><FieldError message={errors.email?.message} /></div>
      <div className="space-y-2"><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} {...register("password")} /><FieldError message={errors.password?.message} /></div>
      {serverError && <p role="alert" className="text-sm text-red-400">{serverError}</p>}
      <Button className="w-full" disabled={isSubmitting}>{isSubmitting ? "Procesando…" : isRegister ? "Crear cuenta" : "Iniciar sesión"}</Button>
      <p className="text-center text-sm text-muted-foreground">{isRegister ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"} <Link className="font-medium text-primary hover:underline" to={isRegister ? "/login" : "/register"}>{isRegister ? "Inicia sesión" : "Regístrate"}</Link></p>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-red-400">{message}</p> : null;
}
