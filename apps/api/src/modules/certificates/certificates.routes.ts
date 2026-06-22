import { Router } from 'express';
import { authenticate, requireRole } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import { createAuditLog } from '@/middleware/audit.middleware';
import { nanoid } from 'nanoid';

const router = Router();

// Generate certificate ID (e.g. ITSA-2026-CERT-XYZ123)
function generateCertId(year: number) {
  return `ITSA-${year}-CERT-${nanoid(6).toUpperCase()}`;
}

// Get user's certificates
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId: req.user!.userId },
      include: { event: { select: { title: true, slug: true, startDate: true } } },
      orderBy: { date: 'desc' },
    });
    res.json({ success: true, data: certificates });
  } catch (err) { next(err); }
});

// Verify certificate
router.get('/verify/:certId', async (req, res, next) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { certificateId: req.params.certId },
      include: {
        user: { select: { firstName: true, lastName: true, prn: true } },
        event: { select: { title: true, slug: true } },
      },
    });

    if (!certificate) {
      return res.json({ success: true, data: { isValid: false } });
    }

    res.json({
      success: true,
      data: {
        isValid: true,
        certificate: {
          id: certificate.certificateId,
          studentName: certificate.studentName,
          eventName: certificate.eventName,
          date: certificate.date,
          position: certificate.position,
        },
      },
    });
  } catch (err) { next(err); }
});

// Admin: Issue certificates (Bulk)
const issueCertSchema = z.object({
  eventId: z.string(),
  userIds: z.array(z.string()),
  position: z.string().optional(),
});

router.post('/issue', authenticate, requireRole('ADMIN'), validate(issueCertSchema), async (req, res, next) => {
  try {
    const { eventId, userIds, position } = req.body;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundError('Event');

    const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
    if (users.length === 0) throw new NotFoundError('Users');

    const year = new Date(event.startDate).getFullYear();

    const certificates = await prisma.$transaction(
      users.map((user: any) =>
        prisma.certificate.create({
          data: {
            certificateId: generateCertId(year),
            userId: user.id,
            eventId: event.id,
            studentName: `${user.firstName} ${user.lastName}`,
            eventName: event.title,
            date: event.endDate,
            position,
          },
        })
      )
    );

    await createAuditLog(req, {
      action: 'CREATE',
      resource: 'Certificate',
      newData: { eventId, count: certificates.length },
    });

    res.status(201).json({ success: true, data: { count: certificates.length } });
  } catch (err) { next(err); }
});

export default router;
