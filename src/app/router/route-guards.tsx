import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/app/providers/auth-context";

function SessionLoader() {
  return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Cargando sesión…</div>;
}

export function ProtectedRoute() {
  const { session, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <SessionLoader />;
  return session ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

export function PublicOnlyRoute() {
  const { session, isLoading } = useAuth();
  if (isLoading) return <SessionLoader />;
  return session ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
