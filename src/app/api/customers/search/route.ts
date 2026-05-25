import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { email: { contains: query } },
        { phone: { contains: query } },
        { taxId: { contains: query } },
      ],
    },
    orderBy: { name: "asc" },
    take: 8,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      taxId: true,
      street: true,
      postalCode: true,
      city: true,
      country: true,
      notes: true,
    },
  });

  return NextResponse.json(customers);
}
