import Redis from 'ioredis';
import { env, isDevelopment } from '@/config/env';
import { logger } from './logger';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  client.on('connect', () => {
    logger.info('Redis connected');
  });

  client.on('error', (err) => {
    logger.error({ err }, 'Redis connection error');
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (isDevelopment) {
  globalForRedis.redis = redis;
}

// ============================================================
// Cache Helpers
// ============================================================

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch {
    return null;
  }
}

export async function setCache(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (err) {
    logger.error({ err, key }, 'Failed to set cache');
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug({ pattern, count: keys.length }, 'Cache invalidated');
    }
  } catch (err) {
    logger.error({ err, pattern }, 'Failed to invalidate cache');
  }
}

export async function invalidateCacheByPrefix(prefix: string): Promise<void> {
  return invalidateCache(`${prefix}:*`);
}

export default redis;
