import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { ReportsClient } from "./reports-client";

type SearchParams = Promise<{ from?: string; to?: string; view?: string }>;

function parseDateOrDefault(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(["ADMIN", "BIURO"]);
  const params = await searchParams;

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const from = parseDateOrDefault(params.from, sevenDaysAgo);
  from.setHours(0, 0, 0, 0);
  const to = parseDateOrDefault(params.to, today);
  to.setHours(23, 59, 59, 999);

  const view = params.view === "orders" ? "orders" : "users";

  const logs = await prisma.workLog.findMany({
    where: { startedAt: { gte: from, lte: to } },
    include: {
      user: { select: { id: true, name: true, role: true } },
      order: { select: { id: true, number: true, name: true, status: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  type LogRow = (typeof logs)[number];

  function durationMs(l: LogRow) {
    const end = l.endedAt ?? new Date();
    return end.getTime() - new Date(l.startedAt).getTime();
  }

  // agregacja po pracowniku
  const userMap = new Map<
    string,
    {
      id: string;
      name: string;
      role: string;
      totalMs: number;
      sessions: number;
      orders: Map<string, { number: string; name: string; ms: number; sessions: number }>;
    }
  >();

  for (const l of logs) {
    const ms = durationMs(l);
    let u = userMap.get(l.user.id);
    if (!u) {
      u = { id: l.user.id, name: l.user.name, role: l.user.role, totalMs: 0, sessions: 0, orders: new Map() };
      userMap.set(l.user.id, u);
    }
    u.totalMs += ms;
    u.sessions += 1;
    let o = u.orders.get(l.order.id);
    if (!o) {
      o = { number: l.order.number, name: l.order.name, ms: 0, sessions: 0 };
      u.orders.set(l.order.id, o);
    }
    o.ms += ms;
    o.sessions += 1;
  }

  const byUser = Array.from(userMap.values())
    .map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      totalMs: u.totalMs,
      sessions: u.sessions,
      orders: Array.from(u.orders.values()).sort((a, b) => b.ms - a.ms),
    }))
    .sort((a, b) => b.totalMs - a.totalMs);

  // agregacja po zleceniu
  const orderMap = new Map<
    string,
    {
      id: string;
      number: string;
      name: string;
      status: string;
      totalMs: number;
      sessions: number;
      users: Map<string, { name: string; ms: number; sessions: number }>;
    }
  >();

  for (const l of logs) {
    const ms = durationMs(l);
    let o = orderMap.get(l.order.id);
    if (!o) {
      o = {
        id: l.order.id,
        number: l.order.number,
        name: l.order.name,
        status: l.order.status,
        totalMs: 0,
        sessions: 0,
        users: new Map(),
      };
      orderMap.set(l.order.id, o);
    }
    o.totalMs += ms;
    o.sessions += 1;
    let u = o.users.get(l.user.id);
    if (!u) {
      u = { name: l.user.name, ms: 0, sessions: 0 };
      o.users.set(l.user.id, u);
    }
    u.ms += ms;
    u.sessions += 1;
  }

  const byOrder = Array.from(orderMap.values())
    .map((o) => ({
      id: o.id,
      number: o.number,
      name: o.name,
      status: o.status,
      totalMs: o.totalMs,
      sessions: o.sessions,
      users: Array.from(o.users.values()).sort((a, b) => b.ms - a.ms),
    }))
    .sort((a, b) => b.totalMs - a.totalMs);

  const totalMs = logs.reduce((acc, l) => acc + durationMs(l), 0);

  return (
    <ReportsClient
      from={from}
      to={to}
      view={view}
      totalMs={totalMs}
      totalSessions={logs.length}
      byUser={byUser}
      byOrder={byOrder}
    />
  );
}
