"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarDays, Factory, PlayCircle, RefreshCw, Square, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { startWorkLog, stopWorkLog } from "../zlecenia/actions";
import { formatDate, formatDuration } from "@/lib/time";

type ActiveWorker = { id: string; name: string; startedAt: Date };
type Category = { id: string; name: string };
type ServiceOption = { id: string; name: string };

type Order = {
  id: string;
  number: string;
  name: string;
  customer: string | null;
  status: string;
  workflow: string;
  color: string | null;
  dueDate: Date | null;
  workerCanComplete: boolean;
  category: Category | null;
  serviceOptions: ServiceOption[];
  activeWorkers: ActiveWorker[];
};

type MyActiveLog = { id: string; orderId: string; startedAt: Date };

type Props = {
  orders: Order[];
  userId: string;
  isManager: boolean;
  categories: Category[];
  myActiveLog: MyActiveLog | null;
};

function LiveTimer({ start }: { start: Date }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono">{formatDuration(new Date(start), null)}</span>;
}

const LONG_LOG_MS = 12 * 60 * 60 * 1000;

function isLongRunning(startedAt: Date): boolean {
  return Date.now() - new Date(startedAt).getTime() > LONG_LOG_MS;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    OPEN: { label: "Otwarte", cls: "bg-sky-500/15 text-sky-300 ring-sky-500/30" },
    IN_PROGRESS: { label: "W toku", cls: "bg-amber-500/15 text-amber-300 ring-amber-500/30" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-700 text-slate-300 ring-slate-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ${s.cls}`}>
      {s.label}
    </span>
  );
}

function OrderTile({
  order,
  userId,
  hasOtherActive,
  isMyActive,
  myActiveLog,
  isManager,
}: {
  order: Order;
  userId: string;
  hasOtherActive: boolean;
  isMyActive: boolean;
  myActiveLog: MyActiveLog | null;
  isManager: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [stoppingNote, setStoppingNote] = useState(false);
  const [error, setError] = useState<string>();

  const otherActive = order.activeWorkers.filter((w) => w.id !== userId);
  const longOtherActive = otherActive.filter((w) => isLongRunning(w.startedAt));
  const myActiveIsLong = myActiveLog ? isLongRunning(myActiveLog.startedAt) : false;

  function handleStart() {
    setError(undefined);
    const fd = new FormData();
    fd.set("orderId", order.id);
    startTransition(async () => {
      try {
        await startWorkLog(fd);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się rozpocząć.");
      }
    });
  }

  function handleStop(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!myActiveLog) return;
    setError(undefined);
    const fd = new FormData(e.currentTarget);
    fd.set("workLogId", myActiveLog.id);
    startTransition(async () => {
      try {
        await stopWorkLog(fd);
        setStoppingNote(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nie udało się zakończyć.");
      }
    });
  }

  const baseCls = "rounded-2xl border-2 transition";
  const stateCls = isMyActive
    ? "border-emerald-500/60 bg-emerald-500/5"
    : "border-slate-800 bg-slate-900/70";

  return (
    <Card className={`${baseCls} ${stateCls}`}>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base text-slate-400">#{order.number}</span>
              <StatusPill status={order.status} />
              <span className="inline-flex rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-300 ring-1 ring-indigo-500/30">
                {order.workflow === "SIMPLE" ? "Prosty" : "Rozszerzone"}
              </span>
            </div>
            <div className="mt-1 text-xl font-semibold leading-tight">{order.name}</div>
            {order.category && (
              <div className="mt-2 inline-flex rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300 ring-1 ring-slate-700">
                {order.category.name}
              </div>
            )}
            {order.color && (
              <div className="mt-2 text-sm text-slate-400">Kolor: {order.color}</div>
            )}
            {order.serviceOptions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {order.serviceOptions.map((option) => (
                  <span key={option.id} className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-300 ring-1 ring-emerald-500/30">
                    {option.name}
                  </span>
                ))}
              </div>
            )}
            {order.customer && (
              <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                <User className="h-4 w-4" />
                {order.customer}
              </div>
            )}
          </div>
          {order.dueDate && (
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <CalendarDays className="h-4 w-4" />
              {formatDate(new Date(order.dueDate))}
            </div>
          )}
        </div>

        {isManager && otherActive.length > 0 && (
          <div className={`rounded-lg px-3 py-2 text-xs ${longOtherActive.length > 0 ? "border border-amber-500/40 bg-amber-500/10 text-amber-100" : "bg-slate-950 text-slate-400"}`}>
            <div className="mb-1 flex items-center gap-1.5">
              {longOtherActive.length > 0 ? <AlertTriangle className="h-3.5 w-3.5 text-amber-300" /> : <Users className="h-3.5 w-3.5" />}
              <span>Pracują teraz:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {otherActive.map((w) => (
                <span key={w.id} className={`rounded-full px-2 py-0.5 ${isLongRunning(w.startedAt) ? "bg-amber-500/20 text-amber-100 ring-1 ring-amber-500/30" : "bg-slate-800 text-slate-200"}`}>
                  {w.name} · <LiveTimer start={new Date(w.startedAt)} />
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {isMyActive && myActiveLog ? (
          <div className="space-y-3">
            <div className={`rounded-xl px-4 py-3 text-center ${myActiveIsLong ? "border border-amber-500/40 bg-amber-500/10" : "bg-emerald-500/10"}`}>
              <div className={`text-xs uppercase tracking-wider ${myActiveIsLong ? "text-amber-300" : "text-emerald-400"}`}>
                {myActiveIsLong ? "Uwaga: bardzo długie odbicie" : "Twoja praca"}
              </div>
              <div className={`mt-1 text-4xl font-bold ${myActiveIsLong ? "text-amber-300" : "text-emerald-300"}`}>
                <LiveTimer start={new Date(myActiveLog.startedAt)} />
              </div>
              {myActiveIsLong && (
                <div className="mt-2 text-sm text-amber-100/80">
                  Jeśli skończyłeś pracę, zakończ odbicie.
                </div>
              )}
            </div>
            {stoppingNote ? (
              <form onSubmit={handleStop} className="space-y-2">
                <input
                  name="note"
                  autoFocus
                  maxLength={500}
                  placeholder="Notatka (opcjonalnie)"
                  className="h-14 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {order.workerCanComplete && (
                  <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base cursor-pointer">
                    <input type="checkbox" name="completeOrder" className="h-5 w-5 rounded border-slate-600" />
                    <span className="font-medium text-slate-100">Zakończ całe zlecenie</span>
                  </label>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={pending} className="h-16 flex-1 gap-2 bg-red-600 text-lg hover:bg-red-500">
                    <Square className="h-6 w-6" />
                    Zakończ
                  </Button>
                  <Button type="button" variant="ghost" disabled={pending} onClick={() => setStoppingNote(false)} className="h-16">
                    Anuluj
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                onClick={() => setStoppingNote(true)}
                disabled={pending}
                className="h-20 w-full gap-3 bg-red-600 text-xl hover:bg-red-500"
              >
                <Square className="h-7 w-7" />
                Zakończ pracę
              </Button>
            )}
          </div>
        ) : (
          <Button
            onClick={handleStart}
            disabled={pending || hasOtherActive}
            title={hasOtherActive ? "Masz już aktywne odbicie na innym zleceniu" : undefined}
            className="h-20 w-full gap-3 bg-emerald-600 text-xl hover:bg-emerald-500 disabled:opacity-40"
          >
            <PlayCircle className="h-7 w-7" />
            Rozpocznij pracę
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductionClient({ orders, userId, isManager, categories, myActiveLog }: Props) {
  const router = useRouter();

  // auto-refresh co 30s, żeby liczniki innych pracowników i lista byly świeże
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(id);
  }, [router]);

  const [categoryFilter, setCategoryFilter] = useState("all");
  const hasMyActive = !!myActiveLog;
  const filteredOrders = categoryFilter === "all" ? orders : orders.filter((o) => (o.category?.id ?? "none") === categoryFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
            <Factory className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Produkcja</h1>
            <p className="text-sm text-slate-400">
              {isManager ? "Wszystkie aktywne zlecenia" : "Twoje zlecenia"} · {filteredOrders.length} {filteredOrders.length === 1 ? "pozycja" : "pozycji"}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.refresh()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Odśwież
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <span className="text-sm text-slate-400">Filtr kategorii:</span>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-base text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="all">Wszystkie</option>
          <option value="none">Bez kategorii</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      {hasMyActive && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          <PlayCircle className="h-4 w-4" />
          Masz aktywną pracę — zakończ ją zanim rozpoczniesz na innym zleceniu.
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/40 py-20 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-slate-600" />
          <div className="mt-3 text-lg font-medium text-slate-300">Brak zleceń do pracy</div>
          <div className="mt-1 text-sm text-slate-500">
            {isManager
              ? "Nie ma teraz żadnych otwartych zleceń."
              : "Nie jesteś aktualnie przypisany do żadnego aktywnego zlecenia. Skontaktuj się z biurem."}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map((o) => (
            <OrderTile
              key={o.id}
              order={o}
              userId={userId}
              hasOtherActive={hasMyActive && myActiveLog?.orderId !== o.id}
              isMyActive={myActiveLog?.orderId === o.id}
              myActiveLog={myActiveLog}
              isManager={isManager}
            />
          ))}
        </div>
      )}
    </div>
  );
}
