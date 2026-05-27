import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isManager } from "@/types/roles";

export const runtime = "nodejs";

function csvEscape(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatPl(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !isManager(session.user.role)) {
    return new NextResponse("Brak uprawnień", { status: 403 });
  }

  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const from = fromParam ? new Date(fromParam) : new Date(0);
  from.setHours(0, 0, 0, 0);
  const to = toParam ? new Date(toParam) : new Date();
  to.setHours(23, 59, 59, 999);

  const logs = await prisma.workLog.findMany({
    where: { startedAt: { gte: from, lte: to } },
    include: {
      user: { select: { name: true, role: true } },
      order: { select: { number: true, name: true } },
    },
    orderBy: { startedAt: "asc" },
  });

  const headers = [
    "Pracownik",
    "Rola",
    "Numer zlecenia",
    "Nazwa zlecenia",
    "Start",
    "Koniec",
    "Czas (godziny)",
    "Czas (minuty)",
  ];

  const rows = logs.map((l) => {
    const end = l.endedAt ?? new Date();
    const ms = end.getTime() - new Date(l.startedAt).getTime();
    const minutes = Math.max(0, Math.floor(ms / 60000));
    const hours = (ms / 3_600_000).toFixed(2);

    return [
      l.user.name,
      l.user.role,
      l.order.number,
      l.order.name,
      formatPl(new Date(l.startedAt)),
      l.endedAt ? formatPl(new Date(l.endedAt)) : "w trakcie",
      hours,
      String(minutes),
    ].map(csvEscape).join(",");
  });

  const csv = "\ufeff" + [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="raport_${fromParam ?? "all"}_${toParam ?? "now"}.csv"`,
    },
  });
}
