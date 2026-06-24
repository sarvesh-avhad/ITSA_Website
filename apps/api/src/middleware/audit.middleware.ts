import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { AuditAction } from '@prisma/client';

interface AuditLogData {
  action: AuditAction | string;
  resource: string;
  resourceId?: string;
  oldData?: unknown;
  newData?: unknown;
}

/**
 * Create an audit log entry.
 * Call this from service layer after successful write operations.
 */
export async function createAuditLog(
  req: Request,
  data: AuditLogData
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.userId || null,
        action: data.action as AuditAction,
        resource: data.resource,
        resourceId: data.resourceId || null,
        oldData: data.oldData ? (data.oldData as object) : undefined,
        newData: data.newData ? (data.newData as object) : undefined,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });
  } catch (err) {
    // Audit logging should never break the request
    logger.error({ err, ...data }, 'Failed to create audit log');
  }
}

/**
 * Middleware factory for automatic audit logging on specific routes.
 */
export function auditLog(action: AuditAction, resource: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Store audit context for later use in controller/service
    (req as any).auditContext = { action, resource };
    next();
  };
}
