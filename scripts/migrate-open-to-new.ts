import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.productionOrder.updateMany({
    where: {
      status: 'OPEN',
    },
    data: {
      status: 'NEW',
    },
  });

  console.log(`Updated ${result.count} orders from OPEN to NEW`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
