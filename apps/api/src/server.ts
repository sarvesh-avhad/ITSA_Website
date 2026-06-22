import app from '@/app';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

const PORT = env.PORT;

async function bootstrap() {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Connect to Redis
    await redis.connect();
    logger.info('✅ Redis connected');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 ITSA API Server running on port ${PORT}`);
      logger.info(`📋 Health check: http://localhost:${PORT}/api/${env.API_VERSION}/health`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    logger.fatal({ err }, '❌ Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');

    redis.disconnect();
    logger.info('Redis disconnected');

    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejections
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

bootstrap();
