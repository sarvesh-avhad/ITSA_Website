import type { Request, Response } from 'express';
import { eventsService } from './events.service';
import type { CreateEventRequest, UpdateEventRequest, EventFilters } from '@itsa/shared';

import { NotificationService } from '../notifications/notifications.service';
import { NotificationTemplate, NotificationSourceModule } from '@prisma/client';

export class EventsController {
  async list(req: Request, res: Response): Promise<void> {
    const filters = req.query as unknown as EventFilters;
    if (req.originalUrl.includes('/admin')) {
      (filters as any).isAdmin = true;
      (filters as any).userRole = req.user?.role;
      (filters as any).userId = req.user?.userId;
    }
    const result = await eventsService.list(filters);
    res.json({ success: true, data: result.data, meta: result.meta });
  }

  async getBySlug(req: Request, res: Response): Promise<void> {
    const event = await eventsService.getBySlug(req.params.slug as string);
    res.json({ success: true, data: event });
  }

  async create(req: Request, res: Response): Promise<void> {
    const data = req.body as CreateEventRequest;
    const event = await eventsService.create(data, req.user!.userId, req);
    
    // Broadcast EVENT_CREATED only to ITSA_MEMBER
    await NotificationService.broadcast({
      roles: ['ITSA_MEMBER'],
      templateKey: NotificationTemplate.EVENT_CREATED,
      sourceModule: NotificationSourceModule.EVENTS,
      metadata: { title: event.title, shortDescription: event.shortDescription, slug: event.slug }
    });

    res.status(201).json({ success: true, data: event });
  }

  async update(req: Request, res: Response): Promise<void> {
    const data = req.body as UpdateEventRequest;
    const oldEvent = await import('@/lib/prisma').then(m => m.prisma.event.findUnique({ where: { id: req.params.id as string } }));
    
    const event = await eventsService.update(req.params.id as string, data, req);
    
    // If deadline was extended, notify everyone (or registered users)
    if (oldEvent && data.registrationDeadline && new Date(data.registrationDeadline) > new Date(oldEvent.registrationDeadline || 0)) {
       await NotificationService.broadcast({
         roles: ['STUDENT'],
         templateKey: NotificationTemplate.EVENT_DEADLINE_EXTENDED,
         sourceModule: NotificationSourceModule.EVENTS,
         metadata: { 
           title: event.title, 
           slug: event.slug, 
           newDeadline: new Date(data.registrationDeadline).toLocaleDateString() 
         }
       });
    }

    res.json({ success: true, data: event });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const prisma = await import('@/lib/prisma').then(m => m.prisma);
    const event = await prisma.event.findUnique({ 
      where: { id: req.params.id as string },
      include: { registrations: { select: { userId: true } } }
    });
    
    await eventsService.delete(req.params.id as string, req);
    
    if (event) {
      // Send individual notifications to registered users
      const registeredUserIds = event.registrations.map(r => r.userId);
      await Promise.all(registeredUserIds.map(userId => 
        NotificationService.send({
          userId,
          templateKey: NotificationTemplate.EVENT_CANCELLED,
          sourceModule: NotificationSourceModule.EVENTS,
          metadata: { title: event.title }
        })
      ));
    }

    res.json({ success: true, data: { message: 'Event deleted successfully' } });
  }

  async getRegistrations(req: Request, res: Response): Promise<void> {
    const result = await eventsService.getRegistrations(req.params.id as string, req.query as any);
    res.json({ success: true, data: result.data, meta: result.meta });
  }

  async getCategories(_req: Request, res: Response): Promise<void> {
    const categories = await eventsService.getCategories();
    res.json({ success: true, data: categories });
  }

  async exportRegistrations(req: Request, res: Response, next: import('express').NextFunction): Promise<void> {
    try {
      const format = (req.query.format as 'csv' | 'excel') || 'csv';
      const eventId = String(req.params.id);
      const search = req.query.search ? String(req.query.search) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;

      const event = await import('@/lib/prisma').then(m => m.prisma.event.findUnique({ where: { id: eventId } }));
      if (!event) { res.status(404).json({ success: false, error: { message: 'Event not found' } }); return; }

      const where: any = { eventId, deletedAt: null };
      if (status) where.status = status;
      if (search) {
        where.user = {
          OR: [
            { firstName: { contains: search as string, mode: 'insensitive' } },
            { lastName: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
            { prn: { contains: search as string, mode: 'insensitive' } },
          ],
        };
      }

      const registrations = await import('@/lib/prisma').then(m => m.prisma.registration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, email: true,
              prn: true, branch: true, year: true, phone: true,
            },
          },
          team: {
            include: {
              leader: { select: { id: true, firstName: true, lastName: true, email: true } },
              members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
            },
          },
        },
      }));

      const flatData = registrations.map(reg => {
        const isTeam = !!reg.teamId && !!reg.team;
        
        let row: any = {
          'Event Name': event.title,
          'Registration Type': isTeam ? 'TEAM' : 'INDIVIDUAL',
          'Registration Date': reg.createdAt.toISOString(),
          'Status': reg.status,
          'Attendance Marked': reg.attendanceMarked ? 'Yes' : 'No',
        };

        if (isTeam && reg.team) {
          row['Team Name'] = reg.team.name;
          row['Leader'] = `${reg.team.leader.firstName || ''} ${reg.team.leader.lastName || ''} (${reg.team.leader.email})`.trim();
          
          // Flatten up to 4 members horizontally
          const members = reg.team.members;
          for (let i = 0; i < 4; i++) {
            if (members[i]) {
              const m = members[i].user;
              row[`Member ${i + 1}`] = m ? `${m.firstName || ''} ${m.lastName || ''} (${m.email})`.trim() : members[i].email;
            } else {
              row[`Member ${i + 1}`] = '';
            }
          }
        } else {
          row['Team Name'] = 'N/A';
          row['Leader'] = `${reg.user.firstName || ''} ${reg.user.lastName || ''} (${reg.user.email})`.trim();
          row['Member 1'] = '';
          row['Member 2'] = '';
          row['Member 3'] = '';
          row['Member 4'] = '';
        }
        
        return row;
      });

      const columns = [
        { header: 'Event Name', key: 'Event Name', width: 25 },
        { header: 'Registration Type', key: 'Registration Type', width: 15 },
        { header: 'Team Name', key: 'Team Name', width: 20 },
        { header: 'Leader', key: 'Leader', width: 35 },
        { header: 'Member 1', key: 'Member 1', width: 35 },
        { header: 'Member 2', key: 'Member 2', width: 35 },
        { header: 'Member 3', key: 'Member 3', width: 35 },
        { header: 'Member 4', key: 'Member 4', width: 35 },
        { header: 'Status', key: 'Status', width: 15 },
        { header: 'Attendance Marked', key: 'Attendance Marked', width: 15 },
        { header: 'Registration Date', key: 'Registration Date', width: 25 },
      ];

      const { generateCsvBuffer, generateExcelBuffer } = await import('@/utils/export.utils');
      
      let buffer: Buffer;
      let contentType: string;
      let extension: string;

      if (format === 'excel') {
        buffer = await generateExcelBuffer(flatData, columns, 'Registrations');
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
      } else {
        buffer = await generateCsvBuffer(flatData, columns);
        contentType = 'text/csv';
        extension = 'csv';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=registrations_export_${new Date().toISOString().split('T')[0]}.${extension}`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }
}

export const eventsController = new EventsController();
