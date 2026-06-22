import { PrismaClient } from '@prisma/client';
import { env, isDevelopment } from '@/config/env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasourceUrl: env.DATABASE_URL,
  });

if (isDevelopment) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
