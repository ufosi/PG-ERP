import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isManager } from "@/types/roles";
import { ProductionClient } from "./production-client";

export default async function ProductionPage() {
  const session = await auth();
  
  if (!session?.user) {
    return <div>No session found - session is null</div>;
  }
  
  const userId = session.user.id;
  const role = session.user.role;
  const manager = isManager(role);

  const [orders, categories] = await Promise.all([
    prisma.productionOrder.findMany({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
        ...(manager ? {} : { assignees: { some: { id: userId } } }),
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        category: { select: { id: true, name: true } },
        serviceOptions: { select: { id: true, name: true }, orderBy: { name: "asc" } },
        workLogs: {
          where: { endedAt: null },
          select: { id: true, startedAt: true, userId: true, user: { select: { name: true } } },
        },
      },
    }),
    prisma.productionOrderCategory.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const myActiveLog = await prisma.workLog.findFirst({
    where: { userId, endedAt: null },
    select: { id: true, orderId: true, startedAt: true },
  });

  const data = orders.map((o) => ({
    id: o.id,
    number: o.number,
    name: o.name,
    customer: o.customer,
    status: o.status,
    workflow: o.workflow,
    color: o.color,
    dueDate: o.dueDate,
    workerCanComplete: o.workerCanComplete,
    category: o.category,
    serviceOptions: o.serviceOptions,
    activeWorkers: o.workLogs.map((l) => ({ id: l.userId, name: l.user.name, startedAt: l.startedAt })),
  }));

  return (
    <ProductionClient
      orders={data}
      userId={userId}
      isManager={manager}
      categories={categories}
      myActiveLog={
        myActiveLog
          ? { id: myActiveLog.id, orderId: myActiveLog.orderId, startedAt: myActiveLog.startedAt }
          : null
      }
    />
  );
}