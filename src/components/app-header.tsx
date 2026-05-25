import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import type { Session } from "next-auth";
import { Button } from "@/components/ui/button";

export function AppHeader({ session }: { session: Session }) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/85 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">Panel operacyjny</div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard produkcji</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-right sm:block">
            <div className="text-sm font-medium">{session.user?.name}</div>
            <div className="flex items-center justify-end gap-1 text-xs text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              {session.user?.role}
            </div>
          </div>
          <Button asChild variant="secondary" size="icon" aria-label="Wyloguj">
            <Link href="/logout">
              <LogOut className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
