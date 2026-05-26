"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const orderSchema = z.object({
  number: z.string().trim().min(2).max(50).optional(),
  name: z.string().trim().min(2).max(120),
  customer: z.string().trim().max(120).optional(),
  customerPhone: z.string().trim().max(50).optional(),
  customerEmail: z.string().trim().max(120).optional(),
  customerTaxId: z.string().trim().max(30).optional(),
  customerStreet: z.string().trim().max(120).optional(),
  customerPostalCode: z.string().trim().max(20).optional(),
  customerCity: z.string().trim().max(80).optional(),
  customerCountry: z.string().trim().max(80).optional(),
  categoryId: z.string().trim().optional(),
  workflow: z.enum(["SIMPLE", "EXTENDED"]).optional(),
  dueDate: z.string().optional(),
  description: z.string().trim().max(1000).optional(),
  color: z.string().trim().max(80).optional(),
  photos: z.string().trim().max(2000).optional(),
  price: z.string().optional(),
  materialCost: z.string().optional(),
  projectDetails: z.string().trim().max(2000).optional(),
  comments: z.string().trim().max(2000).optional(),
  workerCanComplete: z.boolean().optional(),
});

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
});

const serviceOptionSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

function parseWorkerCanComplete(formData: FormData) {
  const raw = formData.get("workerCanComplete");
  return raw === "on" || raw === "true" || raw === "1";
}

function parseMoney(value: string | undefined) {
  if (!value) return null;
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

async function findOrCreateCustomer(name: string | undefined, phone?: string, email?: string, taxId?: string, street?: string, postalCode?: string, city?: string, country?: string) {
  if (!name) return null;

  return prisma.customer.upsert({
    where: { name },
    update: {
      phone: phone || undefined,
      email: email || undefined,
      taxId: taxId || undefined,
      street: street || undefined,
      postalCode: postalCode || undefined,
      city: city || undefined,
      country: country || undefined,
    },
    create: {
      name,
      phone: phone || null,
      email: email || null,
      taxId: taxId || null,
      street: street || null,
      postalCode: postalCode || null,
      city: city || null,
      country: country || null,
    },
    select: { id: true },
  });
}

async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

function canManageOrders(role: string) {
  return role === "ADMIN" || role === "BIURO";
}

async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  const currentMonthStart = new Date(year, now.getMonth(), 1);
  const currentMonthEnd = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);

  const count = await prisma.productionOrder.count({
    where: {
      createdAt: {
        gte: currentMonthStart,
        lte: currentMonthEnd,
      },
    },
  });

  const nextNumber = count + 1;
  return `${nextNumber}/${month}/${year}`;
}

export async function createProductionOrder(formData: FormData) {
  const session = await requireSession();

  if (!canManageOrders(session.user.role)) {
    throw new Error("Brak uprawnień do tworzenia zleceń.");
  }

  const parsed = orderSchema.parse({
    name: formData.get("name"),
    customer: formData.get("customer") || undefined,
    customerPhone: formData.get("customerPhone") || undefined,
    customerEmail: formData.get("customerEmail") || undefined,
    customerTaxId: formData.get("customerTaxId") || undefined,
    customerStreet: formData.get("customerStreet") || undefined,
    customerPostalCode: formData.get("customerPostalCode") || undefined,
    customerCity: formData.get("customerCity") || undefined,
    customerCountry: formData.get("customerCountry") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    workflow: formData.get("workflow") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    description: formData.get("description") || undefined,
    color: formData.get("color") || undefined,
    photos: formData.get("photos") || undefined,
    price: formData.get("price") || undefined,
    materialCost: formData.get("materialCost") || undefined,
    projectDetails: formData.get("projectDetails") || undefined,
    comments: formData.get("comments") || undefined,
  });

  const assigneeIds = formData.getAll("assigneeIds").map(String).filter(Boolean);
  const serviceOptionIds = formData.getAll("serviceOptionIds").map(String).filter(Boolean);
  const workerCanComplete = parseWorkerCanComplete(formData);
  const customer = await findOrCreateCustomer(parsed.customer, parsed.customerPhone, parsed.customerEmail, parsed.customerTaxId, parsed.customerStreet, parsed.customerPostalCode, parsed.customerCity, parsed.customerCountry);
  const orderNumber = await generateOrderNumber();

  await prisma.productionOrder.create({
    data: {
      number: orderNumber,
      name: parsed.name,
      customer: parsed.customer,
      customerId: customer?.id ?? null,
      description: parsed.description,
      workflow: parsed.workflow ?? "EXTENDED",
      color: parsed.color,
      photos: parsed.photos,
      price: parseMoney(parsed.price),
      materialCost: parseMoney(parsed.materialCost),
      projectDetails: parsed.projectDetails,
      comments: parsed.comments,
      categoryId: parsed.categoryId || null,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      workerCanComplete,
      createdById: session.user.id,
      assignees: assigneeIds.length ? { connect: assigneeIds.map((id) => ({ id })) } : undefined,
      serviceOptions: serviceOptionIds.length ? { connect: serviceOptionIds.map((id) => ({ id })) } : undefined,
    },
  });

  revalidatePath("/zlecenia");
}

export async function createProductionOrderCategory(formData: FormData) {
  const session = await requireSession();

  if (!canManageOrders(session.user.role)) {
    throw new Error("Brak uprawnień do tworzenia kategorii.");
  }

  const parsed = categorySchema.parse({
    name: formData.get("name"),
  });

  const existing = await prisma.productionOrderCategory.findUnique({
    where: { name: parsed.name },
    select: { id: true },
  });

  if (existing) {
    throw new Error(`Kategoria "${parsed.name}" już istnieje.`);
  }

  await prisma.productionOrderCategory.create({
    data: { name: parsed.name },
  });

  revalidatePath("/zlecenia");
  revalidatePath("/produkcja");
}

export async function deleteProductionOrderCategory(formData: FormData) {
  const session = await requireSession();

  if (!canManageOrders(session.user.role)) {
    throw new Error("Brak uprawnień do usuwania kategorii.");
  }

  const categoryId = String(formData.get("categoryId") ?? "");

  await prisma.productionOrder.updateMany({
    where: { categoryId },
    data: { categoryId: null },
  });

  await prisma.productionOrderCategory.delete({
    where: { id: categoryId },
  });

  revalidatePath("/zlecenia");
  revalidatePath("/produkcja");
}

export async function createJobServiceOption(formData: FormData) {
  const session = await requireSession();

  if (!canManageOrders(session.user.role)) {
    throw new Error("Brak uprawnień do tworzenia opcji usług.");
  }

  const parsed = serviceOptionSchema.parse({
    name: formData.get("name"),
  });

  await prisma.jobServiceOption.upsert({
    where: { name: parsed.name },
    update: { active: true },
    create: { name: parsed.name },
  });

  revalidatePath("/zlecenia");
  revalidatePath("/produkcja");
}

export async function deleteJobServiceOption(formData: FormData) {
  const session = await requireSession();

  if (!canManageOrders(session.user.role)) {
    throw new Error("Brak uprawnień do usuwania opcji usług.");
  }

  const serviceOptionId = String(formData.get("serviceOptionId") ?? "");

  await prisma.jobServiceOption.update({
    where: { id: serviceOptionId },
    data: { active: false },
  });

  revalidatePath("/zlecenia");
  revalidatePath("/produkcja");
}

export async function updateOrderAssignees(formData: FormData) {
  const session = await requireSession();

  if (!canManageOrders(session.user.role)) {
    throw new Error("Brak uprawnień do edycji przypisań.");
  }

  const orderId = String(formData.get("orderId") ?? "");
  const assigneeIds = formData.getAll("assigneeIds").map(String).filter(Boolean);

  await prisma.productionOrder.update({
    where: { id: orderId },
    data: {
      assignees: { set: assigneeIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/zlecenia");
}

export async function startWorkLog(formData: FormData) {
  const session = await requireSession();
  const orderId = String(formData.get("orderId") ?? "");

  const existingOpenLog = await prisma.workLog.findFirst({
    where: {
      userId: session.user.id,
      endedAt: null,
    },
  });

  if (existingOpenLog) {
    throw new Error("Masz już rozpoczętą pracę na zleceniu. Najpierw zakończ aktualne odbicie.");
  }

  if (!canManageOrders(session.user.role)) {
    const order = await prisma.productionOrder.findFirst({
      where: {
        id: orderId,
        assignees: { some: { id: session.user.id } },
      },
      select: { id: true },
    });

    if (!order) {
      throw new Error("Nie jesteś przypisany do tego zlecenia.");
    }
  }

  await prisma.workLog.create({
    data: {
      orderId,
      userId: session.user.id,
    },
  });

  revalidatePath("/zlecenia");
}

export async function stopWorkLog(formData: FormData) {
  const session = await requireSession();
  const workLogId = String(formData.get("workLogId") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  const completeOrder = formData.get("completeOrder") === "on" || formData.get("completeOrder") === "true";

  const log = await prisma.workLog.findFirst({
    where: { id: workLogId, userId: session.user.id, endedAt: null },
    select: { id: true, orderId: true },
  });

  if (!log) {
    return;
  }

  await prisma.workLog.update({
    where: { id: log.id },
    data: { endedAt: new Date(), note },
  });

  if (completeOrder) {
    const order = await prisma.productionOrder.findUnique({
      where: { id: log.orderId },
      select: { workerCanComplete: true, status: true, assignees: { where: { id: session.user.id }, select: { id: true } } },
    });

    if (order && order.workerCanComplete && order.assignees.length > 0 && order.status !== "DONE" && order.status !== "CANCELLED") {
      await prisma.productionOrder.update({
        where: { id: log.orderId },
        data: {
          status: "DONE",
          closedAt: new Date(),
          closedById: session.user.id,
        },
      });
    }
  }

  revalidatePath("/zlecenia");
  revalidatePath("/produkcja");
  revalidatePath("/dashboard");
}

export async function forceStopWorkLog(formData: FormData) {
  const session = await requireSession();

  if (!canManageOrders(session.user.role)) {
    throw new Error("Brak uprawnień do zamykania odbić.");
  }

  const workLogId = String(formData.get("workLogId") ?? "");

  await prisma.workLog.updateMany({
    where: { id: workLogId, endedAt: null },
    data: {
      endedAt: new Date(),
      note: "Zamknięte przez managera",
    },
  });

  revalidatePath("/zlecenia");
}

export async function updateWorkLog(formData: FormData) {
  const session = await requireSession();

  if (!canManageOrders(session.user.role)) {
    throw new Error("Brak uprawnień do edycji odbić.");
  }

  const workLogId = String(formData.get("workLogId") ?? "");
  const startedAtStr = String(formData.get("startedAt") ?? "");
  const endedAtStr = String(formData.get("endedAt") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  if (!startedAtStr) {
    throw new Error("Brak daty rozpoczęcia.");
  }

  const startedAt = new Date(startedAtStr);
  if (Number.isNaN(startedAt.getTime())) {
    throw new Error("Nieprawidłowa data rozpoczęcia.");
  }

  let endedAt: Date | null = null;
  if (endedAtStr) {
    endedAt = new Date(endedAtStr);
    if (Number.isNaN(endedAt.getTime())) {
      throw new Error("Nieprawidłowa data zakończenia.");
    }
    if (endedAt.getTime() <= startedAt.getTime()) {
      throw new Error("Koniec musi być późniejszy niż początek.");
    }
  }

  await prisma.workLog.update({
    where: { id: workLogId },
    data: {
      startedAt,
      endedAt,
      note: note || null,
    },
  });

  revalidatePath("/zlecenia");
}

export async function deleteWorkLog(formData: FormData) {
  const session = await requireSession();

  if (!canManageOrders(session.user.role)) {
    throw new Error("Brak uprawnień do usuwania odbić.");
  }

  const workLogId = String(formData.get("workLogId") ?? "");

  await prisma.workLog.delete({ where: { id: workLogId } });

  revalidatePath("/zlecenia");
}

export async function updateProductionOrder(formData: FormData) {
  const session = await requireSession();

  if (!canManageOrders(session.user.role)) {
    throw new Error("Brak uprawnień do edycji zleceń.");
  }

  const orderId = String(formData.get("orderId") ?? "");

  const parsed = orderSchema.parse({
    number: formData.get("number") || undefined,
    name: formData.get("name"),
    customer: formData.get("customer") || undefined,
    customerPhone: formData.get("customerPhone") || undefined,
    customerEmail: formData.get("customerEmail") || undefined,
    customerTaxId: formData.get("customerTaxId") || undefined,
    customerStreet: formData.get("customerStreet") || undefined,
    customerPostalCode: formData.get("customerPostalCode") || undefined,
    customerCity: formData.get("customerCity") || undefined,
    customerCountry: formData.get("customerCountry") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    workflow: formData.get("workflow") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    description: formData.get("description") || undefined,
    color: formData.get("color") || undefined,
    photos: formData.get("photos") || undefined,
    price: formData.get("price") || undefined,
    materialCost: formData.get("materialCost") || undefined,
    projectDetails: formData.get("projectDetails") || undefined,
    comments: formData.get("comments") || undefined,
  });

  if (parsed.number) {
    const numberClash = await prisma.productionOrder.findFirst({
      where: { number: parsed.number, NOT: { id: orderId } },
      select: { id: true },
    });

    if (numberClash) {
      throw new Error(`Numer zlecenia "${parsed.number}" jest już używany przez inne zlecenie.`);
    }
  }

  const serviceOptionIds = formData.getAll("serviceOptionIds").map(String).filter(Boolean);
  const customer = await findOrCreateCustomer(parsed.customer, parsed.customerPhone, parsed.customerEmail, parsed.customerTaxId, parsed.customerStreet, parsed.customerPostalCode, parsed.customerCity, parsed.customerCountry);

  await prisma.productionOrder.update({
    where: { id: orderId },
    data: {
      number: parsed.number,
      name: parsed.name,
      customer: parsed.customer ?? null,
      customerId: customer?.id ?? null,
      categoryId: parsed.categoryId || null,
      description: parsed.description ?? null,
      workflow: parsed.workflow ?? "EXTENDED",
      color: parsed.color ?? null,
      photos: parsed.photos ?? null,
      price: parseMoney(parsed.price),
      materialCost: parseMoney(parsed.materialCost),
      projectDetails: parsed.projectDetails ?? null,
      comments: parsed.comments ?? null,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      workerCanComplete: parseWorkerCanComplete(formData),
      serviceOptions: { set: serviceOptionIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/zlecenia");
}

export async function deleteProductionOrder(formData: FormData) {
  const session = await requireSession();

  if (!canManageOrders(session.user.role)) {
    throw new Error("Brak uprawnień do usuwania zleceń.");
  }

  const orderId = String(formData.get("orderId") ?? "");

  const openLog = await prisma.workLog.findFirst({
    where: { orderId, endedAt: null },
    select: { id: true },
  });

  if (openLog) {
    throw new Error("Nie można usunąć zlecenia z aktywnym odbiciem. Najpierw zakończ wszystkie odbicia.");
  }

  // usuwamy odbicia, potem zlecenie (kasacja kaskadowa nie jest skonfigurowana w schemacie)
  await prisma.workLog.deleteMany({ where: { orderId } });
  await prisma.productionOrder.delete({ where: { id: orderId } });

  revalidatePath("/zlecenia");
}

export async function setOrderStatus(formData: FormData) {
  const session = await requireSession();

  if (!canManageOrders(session.user.role)) {
    throw new Error("Brak uprawnień do zmiany statusu zlecenia.");
  }

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "OPEN");

  const isClosed = status === "DONE" || status === "CANCELLED";

  await prisma.productionOrder.update({
    where: { id: orderId },
    data: {
      status,
      closedAt: isClosed ? new Date() : null,
      closedById: isClosed ? session.user.id : null,
    },
  });

  revalidatePath("/zlecenia");
  revalidatePath("/produkcja");
  revalidatePath("/dashboard");
}


