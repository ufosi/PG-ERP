import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { requireUserSession } from "@/lib/auth-session";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireUserSession();

  return (
    <div className="flex min-h-screen bg-slate-950">
      <AppSidebar role={session.user.role} />
      <div className="min-w-0 flex-1">
        <AppHeader session={session} />
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
