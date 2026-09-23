import { MailCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type VerificationLocationState = { email?: string };

export function VerifyEmailPage() {
  const location = useLocation();
  const email = (location.state as VerificationLocationState | null)?.email;

  return <Card><CardHeader className="text-center"><span className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><MailCheck className="h-6 w-6" /></span><CardTitle>Confirma tu correo</CardTitle><CardDescription>Hemos enviado un enlace de verificación{email ? <> a <span className="font-medium text-foreground">{email}</span></> : " a tu dirección de correo"}.</CardDescription></CardHeader><CardContent className="space-y-4 text-center"><p className="text-sm text-muted-foreground">Abre el mensaje y pulsa el enlace para activar tu cuenta. Después volverás automáticamente a Aim Protocol.</p><p className="text-xs text-muted-foreground">Si no lo encuentras, revisa la carpeta de spam o correo no deseado.</p><Link to="/login" className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold hover:bg-muted">Volver al inicio de sesión</Link></CardContent></Card>;
}
