"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BarChart3, ChevronDown, ChevronUp, ClipboardList, Clock, Download, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { msToHm, toDateInputValue } from "@/lib/time";

type ByUser = {
  id: string;
  name: string;
  role: string;
  totalMs: number;
  sessions: number;
  orders: { number: string; name: string; ms: number; sessions: number }[];
};

type ByOrder = {
  id: string;
  number: string;
  name: string;
  status: string;
  totalMs: number;
  sessions: number;
  users: { name: string; ms: number; sessions: number }[];
};

type Props = {
  from: Date;
  to: Date;
  view: "users" | "orders";
  totalMs: number;
  totalSessions: number;
  byUser: ByUser[];
  byOrder: ByOrder[];
};

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: typeof Clock; accent: string }) {
  return (
    <Card className="border-slate-800 bg-slate-900/70">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <Icon className={`h-5 w-5 ${accent}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function UserRow({ u }: { u: ByUser }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-slate-900"
      >
        <div className="min-w-0">
          <div className="font-medium">{u.name}</div>
          <div className="text-xs text-slate-500">{u.role} · {u.sessions} {u.sessions === 1 ? "odbicie" : "odbić"}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-lg text-emerald-400">{msToHm(u.totalMs)}</div>
          {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-800 p-3">
          <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">Rozbicie po zleceniach</div>
          <div className="space-y-1">
            {u.orders.map((o, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-md bg-slate-950 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <span className="font-mono text-xs text-slate-500">#{o.number}</span>{" "}
                  <span>{o.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{o.sessions} {o.sessions === 1 ? "odb." : "odb."}</span>
                  <span className="font-mono text-slate-200">{msToHm(o.ms)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderRow({ o }: { o: ByOrder }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-slate-900"
      >
        <div className="min-w-0">
          <div className="font-medium">
            <span className="font-mono text-sm text-slate-500">#{o.number}</span>{" "}
            {o.name}
          </div>
          <div className="text-xs text-slate-500">{o.sessions} {o.sessions === 1 ? "odbicie" : "odbić"} · {o.status}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-mono text-lg text-emerald-400">{msToHm(o.totalMs)}</div>
          {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-800 p-3">
          <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">Rozbicie po pracownikach</div>
          <div className="space-y-1">
            {o.users.map((u, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-md bg-slate-950 px-3 py-2 text-sm">
                <div>{u.name}</div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{u.sessions} {u.sessions === 1 ? "odb." : "odb."}</span>
                  <span className="font-mono text-slate-200">{msToHm(u.ms)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ReportsClient({ from, to, view, totalMs, totalSessions, byUser, byOrder }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fromStr, setFromStr] = useState(toDateInputValue(from));
  const [toStr, setToStr] = useState(toDateInputValue(to));

  function setView(v: "users" | "orders") {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("view", v);
    router.push(`/raporty?${sp.toString()}`);
  }

  function applyFilter(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("from", fromStr);
    sp.set("to", toStr);
    router.push(`/raporty?${sp.toString()}`);
  }

  function quickRange(days: number) {
    const t = new Date();
    const f = new Date();
    f.setDate(f.getDate() - (days - 1));
    setFromStr(toDateInputValue(f));
    setToStr(toDateInputValue(t));
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("from", toDateInputValue(f));
    sp.set("to", toDateInputValue(t));
    router.push(`/raporty?${sp.toString()}`);
  }

  const csvHref = `/raporty/export?from=${toDateInputValue(from)}&to=${toDateInputValue(to)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
            <BarChart3 className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Raporty czasu pracy</h1>
            <p className="text-sm text-slate-400">
              {toDateInputValue(from)} → {toDateInputValue(to)}
            </p>
          </div>
        </div>
        <a href={csvHref}>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Eksport CSV
          </Button>
        </a>
      </div>

      <Card className="border-slate-800 bg-slate-900/70">
        <CardContent className="pt-6">
          <form onSubmit={applyFilter} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Od</label>
              <input
                type="date"
                value={fromStr}
                onChange={(e) => setFromStr(e.target.value)}
                className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Do</label>
              <input
                type="date"
                value={toStr}
                onChange={(e) => setToStr(e.target.value)}
                className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500">Pokaż</Button>
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="ghost" onClick={() => quickRange(1)}>Dziś</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => quickRange(7)}>7 dni</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => quickRange(30)}>30 dni</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Łączny czas" value={msToHm(totalMs)} icon={Clock} accent="text-emerald-400" />
        <StatCard label="Liczba odbić" value={String(totalSessions)} icon={FileText} accent="text-sky-400" />
        <StatCard label="Pracownicy" value={String(byUser.length)} icon={Users} accent="text-violet-400" />
      </section>

      <div className="flex gap-2">
        <button
          onClick={() => setView("users")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            view === "users" ? "bg-emerald-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
          }`}
        >
          <Users className="h-4 w-4" />
          Wg pracownika
        </button>
        <button
          onClick={() => setView("orders")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            view === "orders" ? "bg-emerald-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Wg zlecenia
        </button>
      </div>

      <div className="space-y-2">
        {view === "users" ? (
          byUser.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 py-12 text-center text-slate-500">
              Brak odbić w wybranym okresie.
            </div>
          ) : (
            byUser.map((u) => <UserRow key={u.id} u={u} />)
          )
        ) : byOrder.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 py-12 text-center text-slate-500">
            Brak odbić w wybranym okresie.
          </div>
        ) : (
          byOrder.map((o) => <OrderRow key={o.id} o={o} />)
        )}
      </div>
    </div>
  );
}
