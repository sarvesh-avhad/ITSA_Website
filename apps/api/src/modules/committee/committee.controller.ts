import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/middleware/audit.middleware';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { CommitteeType, NotificationTemplate, NotificationSourceModule } from '@prisma/client';
import { NotificationService } from '../notifications/notifications.service';

const assignmentSchema = z.object({
  committee: z.nativeEnum(CommitteeType),
  position: z.string().min(1, 'Position is required'),
  description: z.string().optional(),
  committeeImage: z.string().optional(),
  linkedinUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  displayOrder: z.number().int().min(0).default(0),
});

const reorderSchema = z.array(z.object({
  userId: z.string(),
  displayOrder: z.number().int().min(0),
})).min(1);

export const getAssignedMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignments = await prisma.committeeAssignment.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          }
        }
      }
    });

    // Filter to only those with valid roles (ITSA_MEMBER, ADMIN, SUPER_ADMIN)
    const activeAssignments = assignments.filter(a => ['ITSA_MEMBER', 'ADMIN', 'SUPER_ADMIN'].includes(a.user.role));

    res.json({ success: true, data: activeAssignments });
  } catch (err) {
    next(err);
  }
};

export const getAdminView = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eligibleUsers = await prisma.user.findMany({
      where: {
        role: { in: ['ITSA_MEMBER', 'ADMIN', 'SUPER_ADMIN'] }
      },
      include: {
        committeeAssignment: true
      }
    });

    const assigned = eligibleUsers.filter(u => u.committeeAssignment !== null);
    const unassigned = eligibleUsers.filter(u => u.committeeAssignment === null);

    res.json({ success: true, data: { assigned, unassigned } });
  } catch (err) {
    next(err);
  }
};

export const createCommitteeAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;
    const validatedData = assignmentSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    const existing = await prisma.committeeAssignment.findUnique({ where: { userId } });
    if (existing) {
      next(new ValidationError('This user already has a committee assignment', []));
      return;
    }

    const assignment = await prisma.committeeAssignment.create({
      data: {
        ...validatedData,
        userId,
      },
      include: { user: true }
    });

    await createAuditLog(req, {
      action: 'COMMITTEE_MEMBER_CREATED',
      resource: 'CommitteeAssignment',
      resourceId: assignment.id,
      targetUserName: `${user.firstName} ${user.lastName}`,
    });

    await NotificationService.send({
      userId,
      templateKey: NotificationTemplate.COMMITTEE_ASSIGNED,
      sourceModule: NotificationSourceModule.COMMITTEE,
      metadata: { committee: assignment.committee, position: assignment.position }
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new ValidationError(err.errors[0].message, err.errors));
      return;
    }
    next(err);
  }
};

export const updateCommitteeAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;
    const validatedData = assignmentSchema.partial().parse(req.body);

    const existing = await prisma.committeeAssignment.findUnique({ where: { userId }, include: { user: true } });
    if (!existing) throw new NotFoundError('Committee Assignment');

    const assignment = await prisma.committeeAssignment.update({
      where: { userId },
      data: validatedData,
      include: { user: true }
    });

    await createAuditLog(req, {
      action: 'COMMITTEE_MEMBER_UPDATED',
      resource: 'CommitteeAssignment',
      resourceId: assignment.id,
      targetUserName: `${existing.user.firstName} ${existing.user.lastName}`,
    });

    res.json({ success: true, data: assignment });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new ValidationError(err.errors[0].message, err.errors));
      return;
    }
    next(err);
  }
};

export const deleteCommitteeAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;

    const existing = await prisma.committeeAssignment.findUnique({ where: { userId }, include: { user: true } });
    if (!existing) throw new NotFoundError('Committee Assignment');

    await prisma.committeeAssignment.delete({ where: { userId } });

    await createAuditLog(req, {
      action: 'COMMITTEE_MEMBER_DELETED',
      severity: 'WARNING',
      resource: 'CommitteeAssignment',
      resourceId: existing.id,
      targetUserName: `${existing.user.firstName} ${existing.user.lastName}`,
    });

    res.json({ success: true, data: { message: 'Committee assignment deleted successfully' } });
  } catch (err) {
    next(err);
  }
};

export const reorderCommittee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = reorderSchema.parse(req.body);

    await prisma.$transaction(
      validatedData.map((item) =>
        prisma.committeeAssignment.update({
          where: { userId: item.userId },
          data: { displayOrder: item.displayOrder },
        })
      )
    );

    // Get the committee name from the first item to include in the audit log (optional but helpful)
    let committeeName = 'Unknown';
    if (validatedData.length > 0) {
      const firstAssignment = await prisma.committeeAssignment.findUnique({
        where: { userId: validatedData[0].userId },
        select: { committee: true }
      });
      if (firstAssignment) {
        committeeName = firstAssignment.committee;
      }
    }

    await createAuditLog(req, {
      action: 'COMMITTEE_REORDERED',
      resource: 'CommitteeAssignment',
      resourceId: 'batch',
      targetUserName: `${committeeName} Committee (${validatedData.length} members)`,
    });

    res.json({ success: true, data: { message: 'Committee reordered successfully' } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new ValidationError(err.errors[0].message, err.errors));
      return;
    }
    next(err);
  }
};
