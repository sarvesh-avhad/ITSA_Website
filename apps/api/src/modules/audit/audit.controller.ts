import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class AuditController {
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;

      const { search, action, resource, severity, dateFilter, startDate, endDate, category } = req.query;

      const where: Prisma.AuditLogWhereInput = {};

      if (action) where.action = action as string;
      if (resource) where.resource = resource as string;
      if (severity) where.severity = severity as string;

      // Category filtering
      if (category) {
        const catMap: Record<string, string[]> = {
          'USER': ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_SUSPENDED', 'USER_REACTIVATED'],
          'ROLE': ['ROLE_CHANGED'],
          'PERMISSION': ['PERMISSION_GRANTED', 'PERMISSION_REVOKED'],
          'EVENT': ['EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_DELETED'],
          'REGISTRATION': ['REGISTRATION_CREATED', 'TEAM_REGISTRATION_CREATED', 'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED', 'REGISTRATION_CANCELLED', 'REGISTRATION_UPDATED'],
          'GALLERY': ['ALBUM_CREATED', 'ALBUM_UPDATED', 'ALBUM_DELETED', 'MEDIA_UPLOADED', 'MEDIA_DELETED'],
          'CERTIFICATE': ['CERTIFICATE_ISSUED', 'CERTIFICATE_REVOKED'],
        };
        const mappedActions = catMap[category as string];
        if (mappedActions) {
          where.action = { in: mappedActions };
        }
      }

      // Date Filtering
      if (dateFilter) {
        const now = new Date();
        if (dateFilter === 'TODAY') {
          now.setHours(0, 0, 0, 0);
          where.createdAt = { gte: now };
        } else if (dateFilter === 'LAST_7_DAYS') {
          const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          where.createdAt = { gte: past };
        } else if (dateFilter === 'LAST_30_DAYS') {
          const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          where.createdAt = { gte: past };
        } else if (dateFilter === 'CUSTOM' && startDate && endDate) {
          where.createdAt = {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string),
          };
        }
      }

      if (search) {
        const searchStr = search as string;
        where.OR = [
          { actorName: { contains: searchStr, mode: 'insensitive' } },
          { actorEmail: { contains: searchStr, mode: 'insensitive' } },
          { targetUserName: { contains: searchStr, mode: 'insensitive' } },
          { targetUserEmail: { contains: searchStr, mode: 'insensitive' } },
          { action: { contains: searchStr, mode: 'insensitive' } },
          { resource: { contains: searchStr, mode: 'insensitive' } },
          { resourceId: { contains: searchStr, mode: 'insensitive' } },
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({
        success: true,
        data: logs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const auditController = new AuditController();
