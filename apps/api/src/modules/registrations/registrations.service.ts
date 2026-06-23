import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { redis, getCache, setCache, invalidateCacheByPrefix } from '@/lib/redis';
import { NotFoundError, BadRequestError, ConflictError } from '@/lib/errors';
import { createAuditLog } from '@/middleware/audit.middleware';
import { sendEmail, registrationConfirmationEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { PAGINATION, CACHE_TTL } from '@itsa/shared';
import type { IndividualRegistrationRequest, TeamRegistrationRequest } from '@itsa/shared';
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

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
    if (existing) throw new ConflictError('You are already registered for this event');

    // Check event type
    if (event.eventType === 'TEAM') {
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
      const reg = await tx.registration.create({
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

      // Increment event count
      await tx.event.update({
        where: { id: data.eventId },
        data: { currentCount: { increment: 1 } },
      });

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
      action: 'CREATE',
      resource: 'Registration',
      resourceId: registration.id,
      newData: { eventId: data.eventId, userId },
    });

    return { ...registration, qrCodeDataUrl };
  }

  async registerTeam(data: TeamRegistrationRequest, userId: string, req: Request) {
    const event = await prisma.event.findUnique({ where: { id: data.eventId, deletedAt: null } });
    if (!event) throw new NotFoundError('Event');
    if (!event.isPublished) throw new BadRequestError('Event is not open for registration');

    if (event.eventType === 'INDIVIDUAL') {
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

    // 1. Check existing Registrations for this event
    const existingRegs = await prisma.registration.findMany({
      where: {
        eventId: data.eventId,
        deletedAt: null,
        user: {
          OR: [
            { email: { in: allEmails } },
            { prn: { in: allPrns } }
          ]
        }
      },
      include: { user: true }
    });

    if (existingRegs.length > 0) {
      throw new ConflictError('One or more members are already registered as solo participants or leaders for this event');
    }

    // 2. Check existing TeamMembers for this event
    const existingTeamMembers = await prisma.teamMember.findMany({
      where: {
        team: { eventId: data.eventId },
        OR: [
          { email: { in: allEmails } },
          { prn: { in: allPrns } }
        ]
      }
    });

    if (existingTeamMembers.length > 0) {
      throw new ConflictError('One or more members are already part of another team for this event');
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

      // Create Registration only for the team leader
      const registration = await tx.registration.create({
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

      // Update event count
      await tx.event.update({
        where: { id: data.eventId },
        data: { currentCount: { increment: totalSize } },
      });

      return { team, registration, qrCodeDataUrl: qrId };
    });

    await invalidateCacheByPrefix('events');
    await createAuditLog(req, {
      action: 'CREATE',
      resource: 'Team Registration',
      resourceId: result.team.id,
      newData: { teamName: data.teamName, eventId: data.eventId, memberCount: totalSize },
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
      include: { event: true },
    });

    if (!registration || registration.userId !== userId) {
      throw new NotFoundError('Registration');
    }

    if (registration.status === 'CANCELLED') {
      throw new BadRequestError('Registration is already cancelled');
    }

    await prisma.$transaction([
      prisma.registration.update({
        where: { id },
        data: { status: 'CANCELLED', deletedAt: new Date() },
      }),
      prisma.event.update({
        where: { id: registration.eventId },
        data: { currentCount: { decrement: 1 } },
      }),
    ]);

    await invalidateCacheByPrefix('events');
    await createAuditLog(req, {
      action: 'DELETE',
      resource: 'Registration',
      resourceId: id,
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
        event: { select: { title: true } },
      },
    });

    await createAuditLog(req, {
      action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
      resource: 'Registration',
      resourceId: regId,
      oldData: { status: registration.status },
      newData: { status },
    });

    return updated;
  }

  async markAttendance(regId: string, req: Request) {
    const registration = await prisma.registration.findUnique({ where: { id: regId } });
    if (!registration) throw new NotFoundError('Registration');
    if (registration.attendanceMarked) throw new BadRequestError('Attendance already marked');

    return prisma.registration.update({
      where: { id: regId },
      data: { attendanceMarked: true, attendanceAt: new Date() },
    });
  }

  async getAllRegistrations(page: number, limit: number, search: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
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

  async scanRegistration(qrCode: string, req: Request) {
    if (!qrCode) throw new BadRequestError('QR Code is required');

    const registration = await prisma.registration.findFirst({
      where: { qrCode },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, prn: true } },
        event: { select: { id: true, title: true } },
      },
    });

    if (!registration) throw new NotFoundError('Invalid QR Code');
    
    if (registration.status !== 'APPROVED') {
      throw new BadRequestError(`Registration is ${registration.status}. Cannot mark attendance.`);
    }

    if (registration.attendanceMarked) {
      throw new ConflictError('Attendance has already been marked for this pass');
    }

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: { attendanceMarked: true, attendanceAt: new Date() },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, prn: true } },
        event: { select: { id: true, title: true } },
      },
    });

    await createAuditLog(req, {
      action: 'UPDATE',
      resource: 'Registration',
      resourceId: registration.id,
    });

    return updated;
  }
}

export const registrationsService = new RegistrationsService();
