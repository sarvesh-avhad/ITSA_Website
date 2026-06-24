import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "audit_logs" CASCADE;');
    console.log('Dropped audit_logs table');
    await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "AuditAction" CASCADE;');
    console.log('Dropped AuditAction enum');
  } catch (err) {
    console.error('Error dropping table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
