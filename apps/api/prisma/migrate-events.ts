import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.event.updateMany({
    where: {
      eventType: 'INDIVIDUAL',
    },
    data: {
      minTeamSize: 1,
      maxTeamSize: 1,
    },
  });

  console.log(`Updated ${result.count} events to have min/max team size of 1.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
