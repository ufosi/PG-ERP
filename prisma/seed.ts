import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPinHash = await bcrypt.hash("1234", 12);
  const officePinHash = await bcrypt.hash("2345", 12);
  const workerPinHash = await bcrypt.hash("3456", 12);

  await prisma.user.upsert({
    where: { rfid: "ADMIN-001" },
    update: {},
    create: {
      name: "Administrator",
      pinHash: adminPinHash,
      rfid: "ADMIN-001",
      role: "ADMIN",
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { rfid: "BIURO-001" },
    update: {},
    create: {
      name: "Biuro",
      pinHash: officePinHash,
      rfid: "BIURO-001",
      role: "BIURO",
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { rfid: "PRAC-001" },
    update: {},
    create: {
      name: "Pracownik",
      pinHash: workerPinHash,
      rfid: "PRAC-001",
      role: "PRACOWNIK",
      active: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
