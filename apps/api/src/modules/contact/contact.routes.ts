import { Router } from 'express';
import { authenticate, requireRole } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { paginationSchema } from '@itsa/shared';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import { createAuditLog } from '@/middleware/audit.middleware';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(5),
  message: z.string().min(10),
});

// Public: Submit contact form
router.post('/', validate(contactSchema), async (req, res, next) => {
  try {
    const contact = await prisma.contact.create({
      data: {
        ...req.body,
        userId: req.user?.userId || null,
      },
    });
    res.status(201).json({ success: true, data: { id: contact.id, message: 'Message sent successfully' } });
  } catch (err) { next(err); }
});

// Admin: List messages
router.get('/', authenticate, requireRole('ADMIN'), validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const { page = 1, limit = 12, status } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;

    const [messages, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contact.count({ where }),
    ]);

    res.json({
      success: true,
      data: messages,
      meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
});

// Admin: Update status
const statusSchema = z.object({ status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']) });

router.patch('/:id/status', authenticate, requireRole('ADMIN'), validate(statusSchema), async (req, res, next) => {
  try {
    const { status } = req.body;
    const message = await prisma.contact.update({
      where: { id: (req.params.id as string) },
      data: { status, repliedAt: status === 'RESOLVED' ? new Date() : undefined },
    });

    await createAuditLog(req, {
      action: 'CONTACT_UPDATED',
      severity: 'INFO',
      resource: 'Contact',
      resourceId: message.id,
      newValue: { status },
    });

    res.json({ success: true, data: message });
  } catch (err) { next(err); }
});

export default router;
