import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { createAnnouncementSchema, updateAnnouncementSchema, paginationSchema, PERMISSIONS } from '@itsa/shared';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import { createAuditLog } from '@/middleware/audit.middleware';
import { PAGINATION } from '@itsa/shared';
import slugify from 'slugify';

const router = Router();

// List announcements
router.get('/', validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const { page = 1, limit = 12, search } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { deletedAt: null, isPublished: true };
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      }),
      prisma.announcement.count({ where }),
    ]);

    res.json({
      success: true,
      data: announcements,
      meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
});

// Get announcement by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { slug: (req.params.slug as string), deletedAt: null },
    });
    if (!announcement) throw new NotFoundError('Announcement');
    res.json({ success: true, data: announcement });
  } catch (err) { next(err); }
});

// Create
router.post('/', authenticate, requirePermission(PERMISSIONS.ANNOUNCEMENTS_CREATE), validate(createAnnouncementSchema), async (req, res, next) => {
  try {
    const slug = slugify(req.body.title, { lower: true, strict: true }) + '-' + Date.now();
    const announcement = await prisma.announcement.create({
      data: {
        ...req.body,
        slug,
        authorId: req.user!.userId,
        publishedAt: req.body.isPublished ? new Date() : null,
      },
    });
    await createAuditLog(req, { 
      action: 'ANNOUNCEMENT_CREATED', 
      severity: 'INFO',
      resource: 'Announcement', 
      resourceId: announcement.id,
      newValue: { title: announcement.title }
    });
    res.status(201).json({ success: true, data: announcement });
  } catch (err) { next(err); }
});

// Update
router.patch('/:id', authenticate, requirePermission(PERMISSIONS.ANNOUNCEMENTS_UPDATE), validate(updateAnnouncementSchema), async (req, res, next) => {
  try {
    const existing = await prisma.announcement.findUnique({ where: { id: (req.params.id as string) } });
    if (!existing) throw new NotFoundError('Announcement');

    const data: any = { ...req.body };
    if (req.body.isPublished && !existing.publishedAt) data.publishedAt = new Date();

    const announcement = await prisma.announcement.update({ where: { id: (req.params.id as string) }, data });
    await createAuditLog(req, { 
      action: 'ANNOUNCEMENT_UPDATED', 
      severity: 'INFO',
      resource: 'Announcement', 
      resourceId: announcement.id,
      oldValue: { title: existing.title },
      newValue: { title: announcement.title }
    });
    res.json({ success: true, data: announcement });
  } catch (err) { next(err); }
});

// Delete
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const announcement = await prisma.announcement.findUnique({ where: { id: (req.params.id as string) } });
    if (!announcement) throw new NotFoundError('Announcement');
    await prisma.announcement.update({ where: { id: (req.params.id as string) }, data: { deletedAt: new Date() } });
    await createAuditLog(req, { 
      action: 'ANNOUNCEMENT_DELETED', 
      severity: 'WARNING',
      resource: 'Announcement', 
      resourceId: (req.params.id as string) as string,
      oldValue: { title: announcement.title }
    });
    res.json({ success: true, data: { message: 'Announcement deleted' } });
  } catch (err) { next(err); }
});

export default router;
