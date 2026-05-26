import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CustomersClient } from "./customers-client";

export default async function KlienciPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  const role = session.user.role;

  if (role !== "ADMIN" && role !== "BIURO") {
    redirect("/dashboard");
  }

  const customers = await prisma.customer.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          number: true,
          name: true,
          status: true,
          dueDate: true,
          price: true,
          materialCost: true,
          createdAt: true,
        },
      },
    },
  });

  return <CustomersClient customers={customers} />;
}
