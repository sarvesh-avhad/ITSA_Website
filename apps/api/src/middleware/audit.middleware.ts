import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';


interface AuditLogData {
  action: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  resource: string;
  resourceId?: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  targetUserId?: string;
  targetUserName?: string;
  targetUserEmail?: string;
  oldValue?: unknown;
  newValue?: unknown;
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
    const actorId = data.actorId || req.user?.userId || null;
    let actorName = data.actorName || null;
    let actorEmail = data.actorEmail || req.user?.email || null;
    let targetUserName = data.targetUserName || null;
    let targetUserEmail = data.targetUserEmail || null;

    // Fetch Actor details if missing
    if (actorId && (!actorName || !actorEmail)) {
      const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { firstName: true, lastName: true, email: true } });
      if (actor) {
        actorName = actorName || `${actor.firstName} ${actor.lastName}`;
        actorEmail = actorEmail || actor.email;
      }
    }

    // Fetch Target details if missing
    if (data.targetUserId && (!targetUserName || !targetUserEmail)) {
      const target = await prisma.user.findUnique({ where: { id: data.targetUserId }, select: { firstName: true, lastName: true, email: true } });
      if (target) {
        targetUserName = targetUserName || `${target.firstName} ${target.lastName}`;
        targetUserEmail = targetUserEmail || target.email;
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId,
        actorName,
        actorEmail,
        targetUserId: data.targetUserId || null,
        targetUserName,
        targetUserEmail,
        action: data.action,
        severity: data.severity || 'INFO',
        resource: data.resource,
        resourceId: data.resourceId || null,
        oldValue: data.oldValue ? (data.oldValue as object) : undefined,
        newValue: data.newValue ? (data.newValue as object) : undefined,
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
export function auditLog(action: string, resource: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Store audit context for later use in controller/service
    (req as any).auditContext = { action, resource };
    next();
  };
}
