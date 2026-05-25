"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, Factory, LayoutDashboard, Package, Settings, UserRound, Users } from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles?: ("ADMIN" | "BIURO" | "PRACOWNIK")[];
};

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Produkcja", href: "/produkcja", icon: Factory },
  { name: "Zlecenia", href: "/zlecenia", icon: ClipboardList, roles: ["ADMIN", "BIURO"] },
  { name: "Klienci", href: "/klienci", icon: UserRound, roles: ["ADMIN", "BIURO"] },
  { name: "Magazyn", href: "/magazyn", icon: Package, roles: ["ADMIN", "BIURO"] },
  { name: "Pracownicy", href: "/pracownicy", icon: Users, roles: ["ADMIN", "BIURO"] },
  { name: "Raporty", href: "/raporty", icon: BarChart3, roles: ["ADMIN", "BIURO"] },
  { name: "Ustawienia", href: "/ustawienia", icon: Settings, roles: ["ADMIN"] },
];

export function AppSidebar({ role }: { role: "ADMIN" | "BIURO" | "PRACOWNIK" }) {
  const pathname = usePathname();
  const items = navigation.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-950/80 p-5 lg:block">
      <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
          <Factory className="h-7 w-7" />
        </div>
        <div>
          <div className="text-lg font-semibold">PG-ERP</div>
          <div className="text-xs text-slate-400">ERP/MES Core</div>
        </div>
      </Link>
      <nav className="mt-8 space-y-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium transition ${
                active ? "bg-emerald-500 text-white shadow-lg shadow-emerald-950/40" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
