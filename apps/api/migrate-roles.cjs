const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`UPDATE users SET role = 'ITSA_MEMBER' WHERE role = 'EVENT_COORDINATOR'`;
  console.log("Updated roles!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
