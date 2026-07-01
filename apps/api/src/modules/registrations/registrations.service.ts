import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { redis, getCache, setCache, invalidateCacheByPrefix } from '@/lib/redis';
import { NotFoundError, BadRequestError, ConflictError } from '@/lib/errors';
import { createAuditLog } from '@/middleware/audit.middleware';
import { sendEmail, registrationConfirmationEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { PAGINATION, CACHE_TTL, getRegistrationMode } from '@itsa/shared';
import type { IndividualRegistrationRequest, TeamRegistrationRequest } from '@itsa/shared';
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';
import { NotificationService } from '../notifications/notifications.service';
import { NotificationTemplate, NotificationSourceModule } from '@prisma/client';

class RegistrationsService {
  async registerIndividual(data: IndividualRegistrationRequest, userId: string, req: Request) {
    const event = await prisma.event.findUnique({ where: { id: data.eventId, deletedAt: null } });
    if (!event) throw new NotFoundError('Event');
    if (!event.isPublished) throw new BadRequestError('Event is not open for registration');

    // Check deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new BadRequestError('Registration deadline has passed');
    }

    // Check capacity
    if (event.maxParticipants && event.currentCount >= event.maxParticipants) {
      throw new BadRequestError('Event is at full capacity');
    }

    // Check duplicate registration
    const existing = await prisma.registration.findUnique({
      where: { userId_eventId: { userId, eventId: data.eventId } },
    });
    if (existing && existing.status !== 'CANCELLED') {
      throw new ConflictError('You are already registered for this event');
    }

    // Check event type
    const mode = getRegistrationMode(event);
    if (mode === 'MANDATORY_TEAM') {
      throw new BadRequestError('This event requires team registration');
    }

    // Generate QR code
    const qrId = `ITSA-${nanoid(10)}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrId, {
      width: 300,
      margin: 2,
      color: { dark: '#ffffff', light: '#0a0a0f' },
    });

    // Create registration
    const registration = await prisma.$transaction(async (tx: any) => {
      // Safe increment
      const updatedEvent = await tx.event.updateMany({
        where: { 
          id: data.eventId,
          ...(event.maxParticipants ? { currentCount: { lt: event.maxParticipants } } : {})
        },
        data: { currentCount: { increment: 1 } },
      });

      if (updatedEvent.count === 0 && event.maxParticipants) {
        throw new BadRequestError('Event is at full capacity');
      }

      let reg;
      if (existing) {
        reg = await tx.registration.update({
          where: { id: existing.id },
          data: {
            status: 'APPROVED',
            teamId: null,
            deletedAt: null,
            qrCode: existing.qrCode || qrId,
            formData: data.formData ? (data.formData as object) : undefined,
          },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, prn: true, branch: true, year: true, phone: true } },
            event: { select: { id: true, title: true, slug: true, startDate: true, endDate: true, venue: true, posterUrl: true } },
          },
        });
      } else {
        reg = await tx.registration.create({
          data: {
            userId,
            eventId: data.eventId,
            status: 'APPROVED',
            qrCode: qrId,
            formData: data.formData ? (data.formData as object) : undefined,
          },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, prn: true, branch: true, year: true, phone: true } },
            event: { select: { id: true, title: true, slug: true, startDate: true, endDate: true, venue: true, posterUrl: true } },
          },
        });
      }

      return reg;
    });

    // Send confirmation email (async)
    const emailData = registrationConfirmationEmail({
      studentName: registration.user.firstName,
      eventName: registration.event.title,
      eventDate: new Date(registration.event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      venue: registration.event.venue || 'TBA',
      qrCodeUrl: qrCodeDataUrl,
    });
    sendEmail({ to: registration.user.email, ...emailData }).catch((err) =>
      logger.error({ err }, 'Failed to send registration email')
    );

    await invalidateCacheByPrefix('events');
    await createAuditLog(req, {
      action: 'REGISTRATION_CREATED',
      severity: 'INFO',
      resource: 'Registration',
      resourceId: registration.id,
      newValue: { eventId: data.eventId, userId, eventName: registration.event.title, studentName: `${registration.user.firstName} ${registration.user.lastName || ''}`.trim() },
    });

    await NotificationService.send({
      userId,
      templateKey: NotificationTemplate.REGISTRATION_SUCCESS,
      sourceModule: NotificationSourceModule.REGISTRATIONS,
      metadata: { eventTitle: registration.event.title, eventSlug: registration.event.slug }
    });

    await NotificationService.broadcast({
      roles: ['ADMIN', 'SUPER_ADMIN'],
      templateKey: NotificationTemplate.NEW_REGISTRATION_RECEIVED,
      sourceModule: NotificationSourceModule.REGISTRATIONS,
      metadata: { eventTitle: registration.event.title, userName: `${registration.user.firstName} ${registration.user.lastName || ''}`.trim() }
    });

    return { ...registration, qrCodeDataUrl };
  }

  async registerTeam(data: TeamRegistrationRequest, userId: string, req: Request) {
    const event = await prisma.event.findUnique({ where: { id: data.eventId, deletedAt: null } });
    if (!event) throw new NotFoundError('Event');
    if (!event.isPublished) throw new BadRequestError('Event is not open for registration');

    const mode = getRegistrationMode(event);
    if (mode === 'INDIVIDUAL') {
      throw new BadRequestError('This event only supports individual registration');
    }

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new BadRequestError('Registration deadline has passed');
    }

    const totalSize = data.members.length + 1; // +1 for leader
    if (event.maxTeamSize && totalSize > event.maxTeamSize) {
      throw new BadRequestError(`Team size cannot exceed ${event.maxTeamSize} members`);
    }
    if (event.minTeamSize && totalSize < event.minTeamSize) {
      throw new BadRequestError(`Team must have at least ${event.minTeamSize} members`);
    }

    const leader = await prisma.user.findUnique({ where: { id: userId } });
    if (!leader) throw new NotFoundError('User');

    const memberEmails = data.members.map((m: any) => m.email.toLowerCase());
    const memberPrns = data.members.map((m: any) => m.prn.toUpperCase());

    if (memberEmails.includes(leader.email.toLowerCase()) || (leader.prn && memberPrns.includes(leader.prn.toUpperCase()))) {
      throw new BadRequestError('Team leader cannot be added as a team member');
    }

    const allEmails = [leader.email.toLowerCase(), ...memberEmails];
    const allPrns = [leader.prn?.toUpperCase(), ...memberPrns].filter(Boolean) as string[];

    const userOrFilters: any[] = [{ email: { in: allEmails } }];
    if (allPrns.length > 0) {
      userOrFilters.push({ prn: { in: allPrns } });
    }

    // 1. Check existing Registrations for this event
    const existingRegs = await prisma.registration.findMany({
      where: {
        eventId: data.eventId,
        deletedAt: null,
        user: { OR: userOrFilters }
      },
      include: { user: true }
    });

    if (existingRegs.length > 0) {
      const duplicateUsers = existingRegs.map(reg => reg.user.email).join(', ');
      throw new ConflictError(`One or more members (${duplicateUsers}) are already registered as solo participants or leaders for this event`);
    }

    // 2. Check existing TeamMembers for this event
    const existingTeamMembers = await prisma.teamMember.findMany({
      where: {
        team: { eventId: data.eventId },
        OR: userOrFilters
      }
    });

    if (existingTeamMembers.length > 0) {
      const duplicateMembers = existingTeamMembers.map(tm => tm.email).join(', ');
      throw new ConflictError(`One or more members (${duplicateMembers}) are already part of another team for this event`);
    }

    const qrId = `ITSA-T-${nanoid(10)}`;

    const result = await prisma.$transaction(async (tx: any) => {
      // Create team
      const team = await tx.team.create({
        data: {
          name: data.teamName,
          eventId: data.eventId,
          leaderId: userId,
        },
      });

      // Add team members
      const teamMembersToCreate = data.members.map((m: any) => ({
        teamId: team.id,
        name: m.name,
        email: m.email.toLowerCase(),
        phone: m.phone,
        prn: m.prn.toUpperCase(),
        branch: m.branch,
        year: m.year,
        qrCode: `ITSA-TM-${nanoid(10)}`
      }));

      await tx.teamMember.createMany({
        data: teamMembersToCreate
      });

      // Create or Update Registration only for the team leader
      const existingLeaderReg = await tx.registration.findUnique({
        where: { userId_eventId: { userId, eventId: data.eventId } }
      });

      let registration;
      if (existingLeaderReg) {
        registration = await tx.registration.update({
          where: { id: existingLeaderReg.id },
          data: {
            teamId: team.id,
            status: 'APPROVED',
            qrCode: existingLeaderReg.qrCode || qrId,
            deletedAt: null,
            formData: data.formData ? (data.formData as object) : undefined,
          },
          include: {
            event: { select: { id: true, title: true, startDate: true, venue: true } },
            user: { select: { id: true, firstName: true, email: true } },
          }
        });
      } else {
        registration = await tx.registration.create({
          data: {
            userId,
            eventId: data.eventId,
            teamId: team.id,
            status: 'APPROVED',
            qrCode: qrId,
            formData: data.formData ? (data.formData as object) : undefined,
          },
          include: {
            event: { select: { id: true, title: true, startDate: true, venue: true } },
            user: { select: { id: true, firstName: true, email: true } },
          }
        });
      }

      // Safe capacity update
      const updatedEvent = await tx.event.updateMany({
        where: { 
          id: data.eventId,
          ...(event.maxParticipants ? { currentCount: { lte: event.maxParticipants - totalSize } } : {})
        },
        data: { currentCount: { increment: totalSize } },
      });

      if (updatedEvent.count === 0 && event.maxParticipants) {
        throw new BadRequestError(`Event does not have enough capacity for ${totalSize} members`);
      }

      return { team, registration, qrCodeDataUrl: qrId };
    });

    await invalidateCacheByPrefix('events');
    await createAuditLog(req, {
      action: 'TEAM_REGISTRATION_CREATED',
      severity: 'INFO',
      resource: 'Team Registration',
      resourceId: result.team.id,
      newValue: { teamName: data.teamName, eventId: data.eventId, memberCount: totalSize, eventName: result.registration.event.title, studentName: result.registration.user.firstName },
    });

    await NotificationService.send({
      userId,
      templateKey: NotificationTemplate.TEAM_REGISTRATION_SUCCESS,
      sourceModule: NotificationSourceModule.REGISTRATIONS,
      metadata: { eventTitle: result.registration.event.title, eventSlug: event.slug, teamName: data.teamName }
    });

    await NotificationService.broadcast({
      roles: ['ADMIN', 'SUPER_ADMIN'],
      templateKey: NotificationTemplate.NEW_REGISTRATION_RECEIVED,
      sourceModule: NotificationSourceModule.REGISTRATIONS,
      metadata: { eventTitle: result.registration.event.title, userName: `${result.registration.user.firstName} (Team: ${data.teamName})` }
    });

    return result;
  }

  async getMyRegistrations(userId: string) {
    return prisma.registration.findMany({
      where: { userId, deletedAt: null },
      include: {
        event: { select: { id: true, title: true, slug: true, startDate: true, endDate: true, venue: true, posterUrl: true, status: true } },
        team: {
          include: {
            leader: { select: { id: true, firstName: true, lastName: true, email: true } },
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelRegistration(id: string, userId: string, req: Request) {
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { 
        event: true, 
        team: { include: { members: true } },
        user: { select: { firstName: true, lastName: true } }
      },
    });

    if (!registration || registration.userId !== userId) {
      throw new NotFoundError('Registration');
    }

    if (registration.status === 'CANCELLED') {
      throw new BadRequestError('Registration is already cancelled');
    }

    if (registration.attendanceMarked) {
      throw new BadRequestError('Cannot cancel registration after attendance has been marked');
    }

    if (registration.event.registrationDeadline && new Date() > registration.event.registrationDeadline) {
      throw new BadRequestError('Cannot cancel registration after the registration deadline');
    }

    const isTeam = !!registration.team;
    const decrementAmount = isTeam ? (registration.team!.members.length + 1) : 1;

    await prisma.$transaction(async (tx: any) => {
      await tx.registration.update({
        where: { id },
        data: { status: 'CANCELLED', deletedAt: new Date() },
      });

      if (isTeam && registration.teamId) {
        await tx.team.delete({
          where: { id: registration.teamId }
        });
      }

      const currentEvent = await tx.event.findUnique({ where: { id: registration.eventId } });
      const newCount = Math.max(0, currentEvent.currentCount - decrementAmount);

      await tx.event.update({
        where: { id: registration.eventId },
        data: { currentCount: newCount },
      });
    });

    await invalidateCacheByPrefix('events');
    await createAuditLog(req, {
      action: 'REGISTRATION_CANCELLED',
      severity: 'WARNING',
      resource: 'Registration',
      resourceId: id,
      targetUserId: userId,
      targetUserName: isTeam ? registration.team!.name : `${registration.user.firstName} ${registration.user.lastName || ''}`.trim(),
      oldValue: { 
        status: registration.status, 
        eventName: registration.event.title,
        registrationType: isTeam ? 'TEAM' : 'SOLO',
        teamName: isTeam ? registration.team!.name : undefined,
        seatsRestored: decrementAmount
      },
    });

    await NotificationService.send({
      userId,
      templateKey: NotificationTemplate.REGISTRATION_CANCELLED,
      sourceModule: NotificationSourceModule.REGISTRATIONS,
      metadata: { eventTitle: registration.event.title, eventSlug: registration.event.slug }
    });
  }

  async updateStatus(regId: string, status: string, req: Request) {
    const registration = await prisma.registration.findUnique({ where: { id: regId } });
    if (!registration) throw new NotFoundError('Registration');

    const updated = await prisma.registration.update({
      where: { id: regId },
      data: { status: status as any },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        event: { select: { title: true, slug: true } },
      },
    });

    await createAuditLog(req, {
      action: status === 'APPROVED' ? 'REGISTRATION_APPROVED' : 'REGISTRATION_REJECTED',
      severity: 'INFO',
      resource: 'Registration',
      resourceId: regId,
      oldValue: { status: registration.status },
      newValue: { status, eventName: updated.event.title, studentName: `${updated.user.firstName} ${updated.user.lastName || ''}`.trim() },
    });

    if (status === 'APPROVED' || status === 'REJECTED') {
      await NotificationService.send({
        userId: updated.user.id,
        templateKey: status === 'APPROVED' ? NotificationTemplate.REGISTRATION_APPROVED : NotificationTemplate.REGISTRATION_REJECTED,
        sourceModule: NotificationSourceModule.REGISTRATIONS,
        metadata: { eventTitle: updated.event.title, eventSlug: updated.event.slug }
      });
    }

    return updated;
  }

  async markAttendance(regId: string, req: Request) {
    const registration = await prisma.registration.findUnique({
      where: { id: regId },
      include: {
        event: { select: { title: true } }
      }
    });
    if (!registration) throw new NotFoundError('Registration');
    if (registration.attendanceMarked) throw new BadRequestError('Attendance already marked');

    const updateResult = await prisma.registration.updateMany({
      where: { id: regId, attendanceMarked: false },
      data: { 
        attendanceMarked: true, 
        attendanceAt: new Date(),
        attendanceMarkedById: req.user?.userId || null
      },
    });

    if (updateResult.count === 0) {
      throw new ConflictError('Attendance was already marked by another user.');
    }

    const updated = await prisma.registration.findUnique({ where: { id: regId } });

    await createAuditLog(req, {
      action: 'ATTENDANCE_MARKED_MANUALLY',
      severity: 'INFO',
      resource: 'Registration',
      resourceId: regId,
      newValue: { attendanceMarked: true, eventName: registration.event.title },
    });

    return updated;
  }

  async getAllRegistrations(page: number, limit: number, search: string, user: import('@itsa/shared').JwtPayload, eventId?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {
      deletedAt: null // Only show active registrations
    };
    
    if (eventId) {
      where.eventId = eventId;
    }
    
    if (search) {
      where.OR = [
        { teamName: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { prn: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.registration.count({ where }),
      prisma.registration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, prn: true, year: true, branch: true, phone: true } },
          event: { select: { id: true, title: true, slug: true } },
          attendanceMarkedBy: { select: { id: true, firstName: true, lastName: true } },
          team: {
            include: {
              leader: { select: { id: true, firstName: true, lastName: true, email: true, prn: true, year: true, branch: true, phone: true } },
              members: {
                include: {
                  user: { select: { id: true, firstName: true, lastName: true, email: true, prn: true, year: true, branch: true, phone: true } }
                }
              }
            }
          }
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEventsSummary() {
    const events = await prisma.event.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        status: true,
        _count: {
          select: {
            registrations: { where: { deletedAt: null } }
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    // To get attendees count we need to fetch group by or just a count query.
    // We can run a parallel count for attendees for each event.
    const eventsWithAttendees = await Promise.all(
      events.map(async (event) => {
        const attendeesCount = await prisma.registration.count({
          where: { eventId: event.id, deletedAt: null, attendanceMarked: true }
        });
        return {
          ...event,
          attendeesCount
        };
      })
    );

    return eventsWithAttendees;
  }

  async getEventStats(eventId: string) {
    const [total, attendees] = await Promise.all([
      prisma.registration.count({ where: { eventId, deletedAt: null } }),
      prisma.registration.count({ where: { eventId, deletedAt: null, attendanceMarked: true } }),
    ]);

    return {
      total,
      attendees,
      remaining: total - attendees,
      attendancePercentage: total > 0 ? Math.round((attendees / total) * 100) : 0,
    };
  }

  async adminDeleteRegistration(regId: string, req: Request) {
    const registration = await prisma.registration.findUnique({
      where: { id: regId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        event: { select: { title: true } }
      }
    });

    if (!registration) throw new NotFoundError('Registration');

    await prisma.registration.update({
      where: { id: regId },
      data: { deletedAt: new Date(), status: 'CANCELLED' }
    });

    await createAuditLog(req, {
      action: 'REGISTRATION_DELETED',
      severity: 'WARNING',
      resource: 'Registration',
      resourceId: regId,
      targetUserId: registration.userId,
      targetUserName: `${registration.user.firstName} ${registration.user.lastName || ''}`.trim(),
      oldValue: { status: registration.status, eventName: registration.event.title }
    });
  }

  async exportAllRegistrations(search: string | undefined, eventId?: string) {
    const where: any = { deletedAt: null };
    
    if (eventId) {
      where.eventId = eventId;
    }
    
    if (search) {
      const searchStr = String(search);
      where.OR = [
        { teamName: { contains: searchStr, mode: 'insensitive' } },
        { user: { firstName: { contains: searchStr, mode: 'insensitive' } } },
        { user: { lastName: { contains: searchStr, mode: 'insensitive' } } },
        { user: { prn: { contains: searchStr, mode: 'insensitive' } } },
      ];
    }

    const registrations = await prisma.registration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, prn: true, year: true, branch: true, phone: true } },
        event: { select: { id: true, title: true, slug: true } },
        attendanceMarkedBy: { select: { firstName: true, lastName: true, email: true } },
        team: {
          include: {
            leader: { select: { id: true, firstName: true, lastName: true, email: true, prn: true, year: true, branch: true, phone: true } },
            members: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true, prn: true, year: true, branch: true, phone: true } }
              }
            }
          }
        }
      },
    });

    const flatData = registrations.map(reg => {
      const isTeam = !!reg.teamId && !!reg.team;
      
      let row: any = {
        'Event Name': reg.event?.title || 'Unknown Event',
        'Registration Type': isTeam ? 'TEAM' : 'INDIVIDUAL',
        'Registration Date': reg.createdAt.toISOString(),
        'Status': reg.status,
        'Attendance Status': reg.attendanceMarked ? 'Attended' : 'Not Attended',
        'Marked By': reg.attendanceMarkedBy ? `${reg.attendanceMarkedBy.firstName} ${reg.attendanceMarkedBy.lastName} (${reg.attendanceMarkedBy.email})` : (reg.attendanceMarked ? 'System / QR' : ''),
        'Marked At': reg.attendanceAt ? reg.attendanceAt.toISOString() : '',
      };

      if (isTeam && reg.team) {
        row['Team Name'] = reg.team.name;
        row['Leader'] = `${reg.team.leader.firstName || ''} ${reg.team.leader.lastName || ''} (${reg.team.leader.email})`.trim();
        
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
        row['Leader'] = `${reg.user?.firstName || ''} ${reg.user?.lastName || ''} (${reg.user?.email || ''})`.trim();
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
      { header: 'Attendance Status', key: 'Attendance Status', width: 15 },
      { header: 'Marked By', key: 'Marked By', width: 25 },
      { header: 'Marked At', key: 'Marked At', width: 25 },
      { header: 'Registration Date', key: 'Registration Date', width: 25 },
    ];

    return { flatData, columns };
  }

  async scanRegistration(qrCode: string, req: Request, targetEventId?: string) {
    if (!qrCode) throw new BadRequestError('QR Code is required');

    const registration = await prisma.registration.findFirst({
      where: { qrCode, deletedAt: null },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, prn: true } },
        event: { select: { id: true, title: true } },
      },
    });

    if (!registration) throw new NotFoundError('Invalid QR Code');
    
    if (targetEventId && registration.eventId !== targetEventId) {
      throw new BadRequestError(`This QR code belongs to a different event (${registration.event.title}).`);
    }
    
    if (registration.status !== 'APPROVED') {
      throw new BadRequestError(`Registration is ${registration.status}. Cannot mark attendance.`);
    }

    if (registration.attendanceMarked) {
      throw new ConflictError('Attendance has already been marked for this pass');
    }

    const updateResult = await prisma.registration.updateMany({
      where: { id: registration.id, attendanceMarked: false },
      data: { 
        attendanceMarked: true, 
        attendanceAt: new Date(),
        attendanceMarkedById: req.user?.userId || null 
      }
    });

    if (updateResult.count === 0) {
      throw new ConflictError('Attendance was already marked by another user.');
    }

    const updated = await prisma.registration.findUnique({
      where: { id: registration.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, prn: true } },
        event: { select: { id: true, title: true } },
      },
    });

    await createAuditLog(req, {
      action: 'ATTENDANCE_MARKED_VIA_QR',
      severity: 'INFO',
      resource: 'Registration',
      resourceId: registration.id,
      newValue: { attendanceMarked: true, eventName: registration.event.title },
    });

    return updated;
  }
}

export const registrationsService = new RegistrationsService();
