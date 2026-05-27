import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isManager } from "@/types/roles";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !isManager(session.user.role)) {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const order = await prisma.productionOrder.findUnique({
    where: { id: params.id },
    include: {
      assignees: { select: { id: true, name: true, role: true } },
      category: { select: { id: true, name: true } },
      serviceOptions: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Zlecenie nie znalezione" }, { status: 404 });
  }

  return NextResponse.json(order);
}
