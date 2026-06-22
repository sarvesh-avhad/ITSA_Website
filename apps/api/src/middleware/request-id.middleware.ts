import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

/**
 * Attaches a unique request ID to every request for tracing.
 * Also logs request start and completion.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || uuidv4();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);

  const startTime = Date.now();

  // Log request start
  logger.info({
    requestId: id,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  }, 'Request started');

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      requestId: id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.userId,
    }, 'Request completed');
  });

  next();
}
