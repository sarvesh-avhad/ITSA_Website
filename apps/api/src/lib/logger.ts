import pino from 'pino';
import { env, isDevelopment } from '@/config/env';

export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    service: env.OTEL_SERVICE_NAME,
    env: env.NODE_ENV,
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash'],
    censor: '[REDACTED]',
  },
});

export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

export default logger;
