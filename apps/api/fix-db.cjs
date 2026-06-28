const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`UPDATE "events" SET "eventType" = 'TEAM' WHERE "eventType" = 'BOTH';`;
  console.log('Fixed Events');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
