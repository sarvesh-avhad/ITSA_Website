import { Router } from 'express';
import { authenticate, requireRole } from '@/middleware/auth.middleware';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/middleware/audit.middleware';
import { getCache, setCache, invalidateCacheByPrefix } from '@/lib/redis';
import { CACHE_TTL } from '@itsa/shared';

const router = Router();

// Get public config (frontend relies on this for homepage content)
router.get('/public', async (req, res, next) => {
  try {
    const cached = await getCache<any>('cms:public');
    if (cached) return res.json({ success: true, data: cached });

    const configs = await prisma.siteConfig.findMany({
      where: { section: { in: ['homepage', 'about', 'contact'] } },
    });

    // Transform [{key, value}] to {key: value}
    const configMap = configs.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, any>);

    await setCache('cms:public', configMap, CACHE_TTL.CMS_CONFIG);
    res.json({ success: true, data: configMap });
  } catch (err) { next(err); }
});

// Admin: Get all config
router.get('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const configs = await prisma.siteConfig.findMany();
    res.json({ success: true, data: configs });
  } catch (err) { next(err); }
});

// Admin: Update config bulk
router.patch('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const updates = req.body as { key: string; value: any; section: string }[];

    await prisma.$transaction(
      updates.map(u =>
        prisma.siteConfig.upsert({
          where: { key: u.key },
          update: { value: u.value, updatedBy: req.user!.userId },
          create: { key: u.key, value: u.value, section: u.section, updatedBy: req.user!.userId },
        })
      )
    );

    await invalidateCacheByPrefix('cms');
    await createAuditLog(req, {
      action: 'SETTINGS_UPDATED',
      severity: 'CRITICAL',
      resource: 'SiteConfig',
      newValue: { updatedKeys: updates.map(u => u.key) },
    });

    res.json({ success: true, data: { message: 'Configuration updated successfully' } });
  } catch (err) { next(err); }
});

export default router;
