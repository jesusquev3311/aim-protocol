import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/features/auth/components/auth-form";

export function RegisterPage() {
  return <Card><CardHeader><CardTitle>Crea tu cuenta</CardTitle><CardDescription>Empieza a medir tu progreso mecánico.</CardDescription></CardHeader><CardContent><AuthForm mode="register" /></CardContent></Card>;
}
