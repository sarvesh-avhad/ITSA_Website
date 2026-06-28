import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createAuditLog } from '@/middleware/audit.middleware';

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
          'USERS': ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_SUSPENDED', 'USER_REACTIVATED', 'PROFILE_UPDATED'],
          'AUTH': ['LOGIN', 'LOGOUT', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'ROLE_CHANGED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED'],
          'EVENTS': ['EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_DELETED'],
          'REGISTRATIONS': ['REGISTRATION_CREATED', 'TEAM_REGISTRATION_CREATED', 'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED', 'REGISTRATION_CANCELLED', 'REGISTRATION_UPDATED'],
          'GALLERY': ['ALBUM_CREATED', 'ALBUM_UPDATED', 'ALBUM_DELETED', 'MEDIA_UPLOADED', 'MEDIA_DELETED'],
          'ANNOUNCEMENTS': ['ANNOUNCEMENT_CREATED', 'ANNOUNCEMENT_UPDATED', 'ANNOUNCEMENT_DELETED'],
          'SPONSORS': ['SPONSOR_CREATED', 'SPONSOR_UPDATED', 'SPONSOR_DELETED'],
          'CERTIFICATES': ['CERTIFICATE_ISSUED', 'CERTIFICATE_REVOKED'],
          'SETTINGS': ['SETTINGS_UPDATED', 'SITE_SETTINGS_UPDATED'],
          'SYSTEM': ['BACKUP_CREATED', 'SYSTEM_MAINTENANCE'],
          'COMMITTEE': ['COMMITTEE_MEMBER_CREATED', 'COMMITTEE_MEMBER_UPDATED', 'COMMITTEE_MEMBER_DELETED'],
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

  async exportAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const format = req.query.format as 'csv' | 'excel' || 'csv';
      const { search, action, resource, severity, dateFilter, startDate, endDate, category } = req.query;

      const where: Prisma.AuditLogWhereInput = {};

      if (action) where.action = action as string;
      if (resource) where.resource = resource as string;
      if (severity) where.severity = severity as string;

      // Category filtering
      if (category) {
        const catMap: Record<string, string[]> = {
          'USERS': ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_SUSPENDED', 'USER_REACTIVATED', 'PROFILE_UPDATED'],
          'AUTH': ['LOGIN', 'LOGOUT', 'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED', 'ROLE_CHANGED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED'],
          'EVENTS': ['EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_DELETED'],
          'REGISTRATIONS': ['REGISTRATION_CREATED', 'TEAM_REGISTRATION_CREATED', 'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED', 'REGISTRATION_CANCELLED', 'REGISTRATION_UPDATED'],
          'GALLERY': ['ALBUM_CREATED', 'ALBUM_UPDATED', 'ALBUM_DELETED', 'MEDIA_UPLOADED', 'MEDIA_DELETED'],
          'ANNOUNCEMENTS': ['ANNOUNCEMENT_CREATED', 'ANNOUNCEMENT_UPDATED', 'ANNOUNCEMENT_DELETED'],
          'SPONSORS': ['SPONSOR_CREATED', 'SPONSOR_UPDATED', 'SPONSOR_DELETED'],
          'CERTIFICATES': ['CERTIFICATE_ISSUED', 'CERTIFICATE_REVOKED'],
          'SETTINGS': ['SETTINGS_UPDATED', 'SITE_SETTINGS_UPDATED'],
          'SYSTEM': ['BACKUP_CREATED', 'SYSTEM_MAINTENANCE'],
          'COMMITTEE': ['COMMITTEE_MEMBER_CREATED', 'COMMITTEE_MEMBER_UPDATED', 'COMMITTEE_MEMBER_DELETED'],
        };
        const mappedActions = catMap[category as string];
        if (mappedActions) {
          where.action = { in: mappedActions };
        }
      }

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

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      const flatData = logs.map(log => {
        // Target Resolution
        let target = '';
        if (log.targetUserName) target = log.targetUserName;
        if (log.newValue && typeof log.newValue === 'object') {
          const nv = log.newValue as any;
          if (nv.eventName) target = nv.eventName;
          else if (nv.albumName) target = nv.albumName;
          else if (nv.title) target = nv.title;
          else if (nv.name) target = nv.name;
          else if (nv.studentName) target = nv.studentName;
        }

        // Action Name Formatting
        const formatActionName = (action: string) => {
          return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        };

        // Description Engine
        const actor = log.actorName || 'System';
        let desc = `${actor} performed ${formatActionName(log.action)}`;
        
        switch (log.action) {
          case 'USER_CREATED': desc = `${actor} registered a new account.`; break;
          case 'LOGIN': desc = `${actor} logged into the system.`; break;
          case 'LOGOUT': desc = `${actor} logged out of the system.`; break;
          case 'PASSWORD_RESET_REQUESTED': desc = `${actor} requested a password reset${target ? ` for ${target}` : ''}.`; break;
          case 'PASSWORD_RESET_COMPLETED': desc = `${actor} reset their password.`; break;
          case 'PROFILE_UPDATED': desc = `${actor} updated their profile.`; break;
          case 'ROLE_CHANGED': desc = `${actor} changed the role of ${target} to ${(log.newValue as any)?.role}.`; break;
          case 'PERMISSION_GRANTED': desc = `${actor} granted permissions to ${target}.`; break;
          case 'PERMISSION_REVOKED': desc = `${actor} revoked permissions from ${target}.`; break;
          case 'USER_SUSPENDED': desc = `${actor} suspended the user ${target}.`; break;
          case 'USER_REACTIVATED': desc = `${actor} reactivated the user ${target}.`; break;
          case 'EVENT_CREATED': desc = `${actor} created the event ${target}.`; break;
          case 'EVENT_UPDATED': desc = `${actor} updated the event ${target}.`; break;
          case 'EVENT_DELETED': desc = `${actor} deleted the event ${target}.`; break;
          case 'REGISTRATION_CREATED': desc = `${actor} registered for ${target}.`; break;
          case 'TEAM_REGISTRATION_CREATED': desc = `${actor} registered a team for ${target}.`; break;
          case 'REGISTRATION_APPROVED': desc = `${actor} approved a registration for ${target}.`; break;
          case 'REGISTRATION_CANCELLED': desc = `${actor} cancelled a registration for ${target}.`; break;
          case 'ALBUM_CREATED': desc = `${actor} created the gallery album ${target}.`; break;
          case 'ALBUM_UPDATED': desc = `${actor} updated the gallery album ${target}.`; break;
          case 'ALBUM_DELETED': desc = `${actor} deleted the gallery album ${target}.`; break;
          case 'MEDIA_UPLOADED': desc = `${actor} uploaded media to ${target}.`; break;
          case 'MEDIA_DELETED': desc = `${actor} deleted media from ${target}.`; break;
          case 'ANNOUNCEMENT_CREATED': desc = `${actor} created announcement ${target}.`; break;
          case 'SPONSOR_CREATED': desc = `${actor} added sponsor ${target}.`; break;
          case 'COMMITTEE_MEMBER_CREATED': desc = `${actor} added committee member ${target}.`; break;
          case 'COMMITTEE_MEMBER_UPDATED': desc = `${actor} updated committee member ${target}.`; break;
          case 'COMMITTEE_MEMBER_DELETED': desc = `${actor} deleted committee member ${target}.`; break;
          case 'DATABASE_EXPORTED': desc = `${actor} exported the database.`; break;
          case 'REPORT_EXPORTED': desc = `${actor} exported a report.`; break;
          default:
            if (target) desc = `${actor} performed ${formatActionName(log.action)} on ${target}.`;
        }

        return {
          'Description': desc,
          'Actor': actor,
          'Target': target || 'N/A',
          'Severity': log.severity,
          'Timestamp': log.createdAt.toISOString(),
          'Action': formatActionName(log.action),
          'Old Value': log.oldValue ? JSON.stringify(log.oldValue) : '',
          'New Value': log.newValue ? JSON.stringify(log.newValue) : '',
        };
      });

      const columns = [
        { header: 'Description', key: 'Description', width: 50 },
        { header: 'Actor', key: 'Actor', width: 25 },
        { header: 'Target', key: 'Target', width: 25 },
        { header: 'Severity', key: 'Severity', width: 15 },
        { header: 'Timestamp', key: 'Timestamp', width: 25 },
        { header: 'Action', key: 'Action', width: 25 },
        { header: 'Old Value', key: 'Old Value', width: 40 },
        { header: 'New Value', key: 'New Value', width: 40 },
      ];

      const { generateCsvBuffer, generateExcelBuffer } = await import('@/utils/export.utils');
      
      let buffer: Buffer;
      let contentType: string;
      let extension: string;

      if (format === 'excel') {
        buffer = await generateExcelBuffer(flatData, columns, 'Audit Logs');
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
      } else {
        buffer = await generateCsvBuffer(flatData, columns);
        contentType = 'text/csv';
        extension = 'csv';
      }

      await createAuditLog(req, {
        action: 'REPORT_EXPORTED',
        severity: 'INFO',
        resource: 'AuditLog',
        resourceId: 'export',
        targetUserName: 'Audit Logs Report',
        newValue: { format, recordsExported: flatData.length, category: category || 'ALL' },
      });

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=audit_logs_export_${new Date().toISOString().split('T')[0]}.${extension}`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }
}


export const auditController = new AuditController();
