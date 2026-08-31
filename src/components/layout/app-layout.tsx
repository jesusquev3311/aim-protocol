import { LogOut, Target } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/api/auth";
import { useAuth } from "@/app/providers/auth-context";

export function AppLayout() {
  const { user } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try { await signOut(); } finally { setIsSigningOut(false); }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold"><Target className="h-5 w-5 text-primary" /> Aim Protocol</div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={isSigningOut}><LogOut className="mr-2 h-4 w-4" />Salir</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10"><Outlet /></main>
    </div>
  );
}
