"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const customerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(50).optional(),
  email: z.string().trim().max(120).optional(),
  taxId: z.string().trim().max(30).optional(),
  street: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(20).optional(),
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(1000).optional(),
});

async function requireManager() {
  const session = await auth();

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "BIURO")) {
    throw new Error("Brak uprawnień do zarządzania klientami.");
  }
}

export async function createCustomer(formData: FormData) {
  await requireManager();

  const parsed = customerSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    taxId: formData.get("taxId") || undefined,
    street: formData.get("street") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    city: formData.get("city") || undefined,
    country: formData.get("country") || undefined,
    notes: formData.get("notes") || undefined,
  });

  await prisma.customer.upsert({
    where: { name: parsed.name },
    update: {
      phone: parsed.phone || undefined,
      email: parsed.email || undefined,
      taxId: parsed.taxId || undefined,
      street: parsed.street || undefined,
      postalCode: parsed.postalCode || undefined,
      city: parsed.city || undefined,
      country: parsed.country || undefined,
      notes: parsed.notes || undefined,
    },
    create: {
      name: parsed.name,
      phone: parsed.phone || null,
      email: parsed.email || null,
      taxId: parsed.taxId || null,
      street: parsed.street || null,
      postalCode: parsed.postalCode || null,
      city: parsed.city || null,
      country: parsed.country || null,
      notes: parsed.notes || null,
    },
  });

  revalidatePath("/klienci");
  revalidatePath("/zlecenia");
}
