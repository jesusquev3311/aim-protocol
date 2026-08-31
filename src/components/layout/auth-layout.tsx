import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Aim Protocol</p>
          <p className="mt-2 text-sm text-muted-foreground">Entrenamiento mecánico para Valorant</p>
        </div>
        <Outlet />
      </div>
    </main>
  );
}
