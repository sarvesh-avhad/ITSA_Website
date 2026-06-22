import { Router } from 'express';
import { authenticate, requireRole } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { createSponsorSchema, updateSponsorSchema } from '@itsa/shared';
import { prisma } from '@/lib/prisma';
import { getCache, setCache, invalidateCacheByPrefix } from '@/lib/redis';
import { NotFoundError } from '@/lib/errors';
import { createAuditLog } from '@/middleware/audit.middleware';
import { CACHE_TTL } from '@itsa/shared';
import slugify from 'slugify';

const router = Router();

// List active sponsors
router.get('/', async (_req, res, next) => {
  try {
    const cached = await getCache<any>('sponsors:active');
    if (cached) return res.json({ success: true, data: cached });

    const sponsors = await prisma.sponsor.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ tier: 'asc' }, { sortOrder: 'asc' }],
    });

    await setCache('sponsors:active', sponsors, CACHE_TTL.SPONSORS);
    res.json({ success: true, data: sponsors });
  } catch (err) { next(err); }
});

// Get sponsor detail
router.get('/:slug', async (req, res, next) => {
  try {
    const sponsor = await prisma.sponsor.findUnique({
      where: { slug: (req.params.slug as string), deletedAt: null },
      include: { events: { include: { event: { select: { id: true, title: true, slug: true } } } } },
    });
    if (!sponsor) throw new NotFoundError('Sponsor');
    res.json({ success: true, data: sponsor });
  } catch (err) { next(err); }
});

// Track sponsor click
router.post('/:id/click', async (req, res, next) => {
  try {
    await prisma.sponsor.update({ where: { id: (req.params.id as string) }, data: { clickCount: { increment: 1 } } });
    res.json({ success: true, data: { message: 'Click tracked' } });
  } catch (err) { next(err); }
});

// Create sponsor (Admin)
router.post('/', authenticate, requireRole('ADMIN'), validate(createSponsorSchema), async (req, res, next) => {
  try {
    const slug = slugify(req.body.name, { lower: true, strict: true });
    const sponsor = await prisma.sponsor.create({ data: { ...req.body, slug } });
    await invalidateCacheByPrefix('sponsors');
    await createAuditLog(req, { action: 'CREATE', resource: 'Sponsor', resourceId: sponsor.id });
    res.status(201).json({ success: true, data: sponsor });
  } catch (err) { next(err); }
});

// Update sponsor (Admin)
router.patch('/:id', authenticate, requireRole('ADMIN'), validate(updateSponsorSchema), async (req, res, next) => {
  try {
    const sponsor = await prisma.sponsor.update({ where: { id: (req.params.id as string) }, data: req.body });
    await invalidateCacheByPrefix('sponsors');
    await createAuditLog(req, { action: 'UPDATE', resource: 'Sponsor', resourceId: sponsor.id });
    res.json({ success: true, data: sponsor });
  } catch (err) { next(err); }
});

// Delete sponsor (Admin)
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.sponsor.update({ where: { id: (req.params.id as string) }, data: { deletedAt: new Date() } });
    await invalidateCacheByPrefix('sponsors');
    await createAuditLog(req, { action: 'DELETE', resource: 'Sponsor', resourceId: (req.params.id as string) as string });
    res.json({ success: true, data: { message: 'Sponsor deleted' } });
  } catch (err) { next(err); }
});

export default router;
