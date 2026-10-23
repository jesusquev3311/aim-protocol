import { Crosshair, Menu, Target, X } from "lucide-react";
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/app/providers/auth-context";

export function MarketingLayout() {
  const { session, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const primaryHref = session ? "/dashboard" : "/register";
  const primaryLabel = session ? "Go to dashboard" : "Start training";
  return <div className="min-h-screen overflow-hidden bg-background">
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Target className="h-5 w-5" /></span>Aim Protocol</Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Marketing navigation"><a href="#training" className="transition-colors hover:text-foreground">Training</a><a href="#analytics" className="transition-colors hover:text-foreground">Analytics</a><a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a></nav>
        <div className="hidden items-center gap-3 md:flex">{!session && <Link to="/login" className="inline-flex h-10 items-center px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">Sign in</Link>}<Link to={primaryHref} className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{isLoading ? "Loading…" : primaryLabel}</Link></div>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-md border md:hidden" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      {menuOpen && <nav className="border-t bg-background px-4 py-4 md:hidden" aria-label="Mobile navigation"><div className="mx-auto flex max-w-7xl flex-col gap-2"><a href="#training" className="rounded-md px-3 py-2 text-sm hover:bg-muted" onClick={() => setMenuOpen(false)}>Training</a><a href="#analytics" className="rounded-md px-3 py-2 text-sm hover:bg-muted" onClick={() => setMenuOpen(false)}>Analytics</a><a href="#how-it-works" className="rounded-md px-3 py-2 text-sm hover:bg-muted" onClick={() => setMenuOpen(false)}>How it works</a>{!session && <Link to="/login" className="rounded-md px-3 py-2 text-sm hover:bg-muted">Sign in</Link>}<Link to={primaryHref} className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">{primaryLabel}</Link></div></nav>}
    </header>
    <main><Outlet /></main>
    <footer className="border-t border-white/5"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between"><div><p className="flex items-center gap-2 font-semibold text-foreground"><Crosshair className="h-4 w-4 text-primary" />Aim Protocol</p><p className="mt-2">Deliberate mechanics training, measured clearly.</p></div><p className="max-w-xl text-xs leading-relaxed md:text-right">Aim Protocol is an independent training tracker and is not endorsed by or affiliated with Riot Games. VALORANT is a trademark of Riot Games, Inc.</p></div></footer>
  </div>;
}
