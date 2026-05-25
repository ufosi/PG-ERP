import Link from "next/link";
import { Activity, AlertTriangle, Briefcase, ClipboardList, Clock, Factory, PlayCircle, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUserSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatDuration } from "@/lib/time";
import { isManager } from "@/types/roles";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function sumMs(logs: { startedAt: Date; endedAt: Date | null }[]) {
  return logs.reduce((acc, l) => {
    const end = l.endedAt ?? new Date();
    return acc + (end.getTime() - new Date(l.startedAt).getTime());
  }, 0);
}

function msToHm(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

const LONG_LOG_MS = 12 * 60 * 60 * 1000;

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
  accent: string;
}) {
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

export default async function DashboardPage() {
  const session = await requireUserSession();
  const userId = session.user.id;
  const role = session.user.role;
  const manager = isManager(role);

  if (manager) {
    const [activeOrders, openLogs, todayLogs, recentLogs] = await Promise.all([
      prisma.productionOrder.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.workLog.findMany({
        where: { endedAt: null },
        include: { user: { select: { name: true } }, order: { select: { number: true, name: true } } },
      }),
      prisma.workLog.findMany({
        where: { startedAt: { gte: startOfToday() } },
        select: { startedAt: true, endedAt: true },
      }),
      prisma.workLog.findMany({
        orderBy: { startedAt: "desc" },
        take: 8,
        include: { user: { select: { name: true } }, order: { select: { number: true, name: true } } },
      }),
    ]);

    const onlineUsers = new Set(openLogs.map((l) => l.user.name)).size;
    const todayTotal = msToHm(sumMs(todayLogs));
    const longRunningLogs = openLogs.filter((l) => Date.now() - new Date(l.startedAt).getTime() > LONG_LOG_MS);

    return (
      <div className="space-y-6">
        {longRunningLogs.length > 0 && (
          <Card className="border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
                Uwaga: bardzo długie trwające odbicie
              </CardTitle>
              <CardDescription className="text-amber-100/80">
                Sprawdź, czy pracownik nie zapomniał zakończyć pracy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {longRunningLogs.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-slate-950/70 p-3 text-sm">
                  <div>
                    <div className="font-semibold text-amber-100">{l.user.name}</div>
                    <div className="text-xs text-amber-100/70">#{l.order.number} · {l.order.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-semibold text-amber-300">{formatDuration(new Date(l.startedAt), null)}</div>
                    <div className="text-xs text-amber-100/60">od {formatDateTime(new Date(l.startedAt))}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Aktywne zlecenia" value={String(activeOrders)} icon={Factory} accent="text-sky-400" />
          <StatCard label="Pracownicy online" value={String(onlineUsers)} icon={Users} accent="text-violet-400" />
          <StatCard label="Trwające odbicia" value={String(openLogs.length)} icon={PlayCircle} accent="text-emerald-400" />
          <StatCard label="Łączny czas dziś" value={todayTotal} icon={Clock} accent="text-amber-400" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <Card className="border-slate-800 bg-slate-900/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <PlayCircle className="h-5 w-5 text-emerald-400" />
                Trwająca praca
              </CardTitle>
              <CardDescription>Lista pracowników aktualnie odbitych na zleceniach</CardDescription>
            </CardHeader>
            <CardContent>
              {openLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-6 text-center text-sm text-slate-500">
                  Nikt aktualnie nie pracuje na zleceniu.
                </div>
              ) : (
                <div className="space-y-2">
                  {openLogs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">
                      <div className="min-w-0">
                        <div className="font-medium">{l.user.name}</div>
                        <div className="truncate text-xs text-slate-400">
                          #{l.order.number} · {l.order.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-emerald-400">{formatDuration(new Date(l.startedAt), null)}</div>
                        <div className="text-xs text-slate-500">od {formatDateTime(new Date(l.startedAt))}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Activity className="h-5 w-5 text-emerald-400" />
                Ostatnia aktywność
              </CardTitle>
              <CardDescription>Najnowsze odbicia pracy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-6 text-center text-sm text-slate-500">
                  Brak aktywności.
                </div>
              ) : (
                recentLogs.map((l) => (
                  <div key={l.id} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {l.user.name}{" "}
                        <span className="font-normal text-slate-400">
                          {l.endedAt ? "zakończył pracę" : "rozpoczął pracę"}
                        </span>
                      </div>
                      <div className="truncate text-xs text-slate-400">#{l.order.number} · {l.order.name}</div>
                      <div className="text-xs text-slate-500">{formatDateTime(new Date(l.endedAt ?? l.startedAt))}</div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    );
  }

  // PRACOWNIK
  const [activeLog, myLogsToday, myRecent] = await Promise.all([
    prisma.workLog.findFirst({
      where: { userId, endedAt: null },
      include: { order: { select: { number: true, name: true } } },
    }),
    prisma.workLog.findMany({
      where: { userId, startedAt: { gte: startOfToday() } },
      select: { startedAt: true, endedAt: true },
    }),
    prisma.workLog.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 6,
      include: { order: { select: { number: true, name: true } } },
    }),
  ]);

  const todayTotal = msToHm(sumMs(myLogsToday));
  const sessionsToday = myLogsToday.length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Twój status"
          value={activeLog ? "Pracuje" : "Wolny"}
          icon={PlayCircle}
          accent={activeLog ? "text-emerald-400" : "text-slate-400"}
        />
        <StatCard label="Twój czas dziś" value={todayTotal} icon={Clock} accent="text-amber-400" />
        <StatCard label="Odbicia dziś" value={String(sessionsToday)} icon={Briefcase} accent="text-sky-400" />
      </section>

      <Card className="border-slate-800 bg-slate-900/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <PlayCircle className="h-5 w-5 text-emerald-400" />
            Aktualna praca
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeLog ? (
            <Link href="/zlecenia" className="block">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="text-xs uppercase tracking-wider text-emerald-400">Trwa od {formatDateTime(new Date(activeLog.startedAt))}</div>
                <div className="mt-1 text-lg font-semibold">#{activeLog.order.number} · {activeLog.order.name}</div>
                <div className="mt-2 font-mono text-2xl text-emerald-400">{formatDuration(new Date(activeLog.startedAt), null)}</div>
              </div>
            </Link>
          ) : (
            <Link href="/zlecenia" className="block">
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-6 text-center">
                <ClipboardList className="mx-auto h-8 w-8 text-slate-600" />
                <div className="mt-2 text-sm text-slate-400">Nie pracujesz aktualnie na żadnym zleceniu.</div>
                <div className="mt-1 text-xs text-slate-500">Kliknij, aby przejść do listy zleceń.</div>
              </div>
            </Link>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Activity className="h-5 w-5 text-emerald-400" />
            Twoje ostatnie odbicia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {myRecent.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-6 text-center text-sm text-slate-500">
              Brak odbić.
            </div>
          ) : (
            myRecent.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">#{l.order.number} · {l.order.name}</div>
                  <div className="text-xs text-slate-500">{formatDateTime(new Date(l.startedAt))}</div>
                </div>
                <div className="font-mono text-slate-300">
                  {formatDuration(new Date(l.startedAt), l.endedAt ? new Date(l.endedAt) : null)}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
