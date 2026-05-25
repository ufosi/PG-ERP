import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  await requireRole(["ADMIN"]);

  const [categories, serviceOptions] = await Promise.all([
    prisma.productionOrderCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.jobServiceOption.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return <SettingsClient categories={categories} serviceOptions={serviceOptions} />;
}
