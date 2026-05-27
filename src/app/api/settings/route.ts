import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "BIURO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let settings = await prisma.settings.findFirst();
  
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        yellowWarningDays: 7,
        redWarningDays: 3,
      },
    });
  }

  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { yellowWarningDays, redWarningDays } = body;

  if (typeof yellowWarningDays !== "number" || typeof redWarningDays !== "number") {
    return NextResponse.json({ error: "Invalid values" }, { status: 400 });
  }

  if (yellowWarningDays < 0 || redWarningDays < 0) {
    return NextResponse.json({ error: "Values must be positive" }, { status: 400 });
  }

  let settings = await prisma.settings.findFirst();
  
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        yellowWarningDays,
        redWarningDays,
      },
    });
  } else {
    settings = await prisma.settings.update({
      where: { id: settings.id },
      data: {
        yellowWarningDays,
        redWarningDays,
      },
    });
  }

  return NextResponse.json(settings);
}
