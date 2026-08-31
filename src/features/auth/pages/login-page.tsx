import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/features/auth/components/auth-form";

export function LoginPage() {
  return <Card><CardHeader><CardTitle>Bienvenido de nuevo</CardTitle><CardDescription>Accede para continuar con tu entrenamiento.</CardDescription></CardHeader><CardContent><AuthForm mode="login" /></CardContent></Card>;
}
