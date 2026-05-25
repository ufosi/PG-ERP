import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { EmployeesClient } from "./employees-client";

export default async function EmployeesPage() {
  await requireRole(["ADMIN", "BIURO"]);

  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      rfid: true,
      role: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { workLogs: true } },
    },
  });

  return <EmployeesClient users={users} />;
}
