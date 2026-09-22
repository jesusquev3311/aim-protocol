import { BarChart3, Dumbbell, LayoutDashboard, LogOut, Target, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/api/auth";
import { useAuth } from "@/app/providers/auth-context";
import { useProfile } from "@/features/profiles/hooks/use-profile";

export function AppLayout() {
  const { user } = useAuth();
  const profile = useProfile(user?.id ?? "");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try { await signOut(); } finally { setIsSigningOut(false); }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold"><Target className="h-5 w-5 text-primary" /> Aim Protocol</Link>
          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation"><Link to="/dashboard" className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted"><LayoutDashboard className="h-4 w-4" />Dashboard</Link><Link to="/routine" className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted"><Dumbbell className="h-4 w-4" />Routine</Link><Link to="/statistics" className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted"><BarChart3 className="h-4 w-4" />Analytics</Link></nav>
            <Link to="/profile" className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"><UserRound className="h-4 w-4" /><span className="hidden sm:inline">{profile.data?.username ?? user?.user_metadata.username ?? "Profile"}</span></Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={isSigningOut}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10"><Outlet /></main>
    </div>
  );
}
