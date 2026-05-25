import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OrdersClient } from "./orders-client";

export default async function ZleceniaPage() {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }
  
  const userId = session.user.id;
  const role = session.user.role;

  const isManager = role === "ADMIN" || role === "BIURO";

  if (!isManager) {
    redirect("/produkcja");
  }

  const [orders, categories, serviceOptions] = await Promise.all([
    prisma.productionOrder.findMany({
      where: isManager ? undefined : { assignees: { some: { id: userId } } },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
        closedBy: { select: { name: true } },
        category: { select: { id: true, name: true } },
        customerRef: { select: { id: true, name: true, phone: true, email: true } },
        serviceOptions: { select: { id: true, name: true }, orderBy: { name: "asc" } },
        assignees: { select: { id: true, name: true } },
        workLogs: {
          where: isManager ? undefined : { userId },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { startedAt: "desc" },
        },
      },
    }),
    prisma.productionOrderCategory.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.jobServiceOption.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const activeLog = await prisma.workLog.findFirst({
    where: { userId, endedAt: null },
  });

  const workers = isManager
    ? await prisma.user.findMany({
        where: { active: true, role: { in: ["PRACOWNIK", "BIURO", "ADMIN"] } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, role: true },
      })
    : [];

  return (
    <OrdersClient
      orders={orders}
      workers={workers}
      userId={userId}
      role={role}
      activeLogId={activeLog?.id ?? null}
      activeLogOrderId={activeLog?.orderId ?? null}
      categories={categories}
      serviceOptions={serviceOptions}
    />
  );
}