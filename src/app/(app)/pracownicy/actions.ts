"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

const pinRegex = /^\d{4,8}$/;

const baseSchema = z.object({
  name: z.string().trim().min(2).max(80),
  role: z.enum(["ADMIN", "BIURO", "PRACOWNIK"]),
  rfid: z
    .string()
    .trim()
    .max(64)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  active: z.coerce.boolean().optional().default(true),
});

const createSchema = baseSchema.extend({
  pin: z.string().regex(pinRegex, "PIN musi mieć 4-8 cyfr"),
});

const updateSchema = baseSchema.extend({
  id: z.string().min(1),
  pin: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => v === undefined || pinRegex.test(v), "PIN musi mieć 4-8 cyfr"),
});

export async function createUser(formData: FormData) {
  await requireRole(["ADMIN", "BIURO"]);

  const parsed = createSchema.parse({
    name: formData.get("name"),
    role: formData.get("role"),
    rfid: formData.get("rfid") || undefined,
    pin: formData.get("pin"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });

  if (parsed.rfid) {
    const exists = await prisma.user.findUnique({ where: { rfid: parsed.rfid } });
    if (exists) {
      throw new Error(`RFID "${parsed.rfid}" jest już przypisany do innego pracownika.`);
    }
  }

  const pinHash = await bcrypt.hash(parsed.pin, 12);

  await prisma.user.create({
    data: {
      name: parsed.name,
      role: parsed.role,
      rfid: parsed.rfid,
      pinHash,
      active: parsed.active,
    },
  });

  revalidatePath("/pracownicy");
}

export async function updateUser(formData: FormData) {
  await requireRole(["ADMIN", "BIURO"]);

  const parsed = updateSchema.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    role: formData.get("role"),
    rfid: formData.get("rfid") || undefined,
    pin: formData.get("pin") || undefined,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });

  if (parsed.rfid) {
    const exists = await prisma.user.findFirst({
      where: { rfid: parsed.rfid, NOT: { id: parsed.id } },
    });
    if (exists) {
      throw new Error(`RFID "${parsed.rfid}" jest już przypisany do innego pracownika.`);
    }
  }

  await prisma.user.update({
    where: { id: parsed.id },
    data: {
      name: parsed.name,
      role: parsed.role,
      rfid: parsed.rfid ?? null,
      active: parsed.active,
      ...(parsed.pin ? { pinHash: await bcrypt.hash(parsed.pin, 12) } : {}),
    },
  });

  revalidatePath("/pracownicy");
}

export async function toggleUserActive(formData: FormData) {
  await requireRole(["ADMIN", "BIURO"]);

  const id = String(formData.get("id") ?? "");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;

  await prisma.user.update({
    where: { id },
    data: { active: !user.active },
  });

  revalidatePath("/pracownicy");
}
