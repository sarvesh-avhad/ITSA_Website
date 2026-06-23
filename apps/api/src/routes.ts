import { Router } from 'express';
import type { Request, Response } from 'express';
import authRoutes from '@/modules/auth/auth.routes';
import eventRoutes from '@/modules/events/events.routes';
import registrationRoutes from '@/modules/registrations/registrations.routes';
import galleryRoutes from '@/modules/gallery/gallery.routes';
import sponsorRoutes from '@/modules/sponsors/sponsors.routes';
import announcementRoutes from '@/modules/announcements/announcements.routes';
import certificateRoutes from '@/modules/certificates/certificates.routes';
import cmsRoutes from '@/modules/cms/cms.routes';
import contactRoutes from '@/modules/contact/contact.routes';
import usersRoutes from '@/modules/users/users.routes';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import uploadRoutes from '@/modules/upload/upload.routes';

export const apiRouter = Router();

// ============================================================
// Health Check
// ============================================================

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

apiRouter.get('/health/deep', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latency?: string; error?: string }> = {};

  // Database check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'healthy', latency: `${Date.now() - dbStart}ms` };
  } catch (err: any) {
    checks.database = { status: 'unhealthy', error: err.message };
  }

  // Redis check
  try {
    const redisStart = Date.now();
    await redis.ping();
    checks.redis = { status: 'healthy', latency: `${Date.now() - redisStart}ms` };
  } catch (err: any) {
    checks.redis = { status: 'unhealthy', error: err.message };
  }

  const overallStatus = Object.values(checks).every((c) => c.status === 'healthy')
    ? 'healthy'
    : 'degraded';

  res.status(overallStatus === 'healthy' ? 200 : 503).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    checks,
  });
});

// ============================================================
// Module Routes
// ============================================================

apiRouter.use('/auth', authRoutes);
apiRouter.use('/events', eventRoutes);
apiRouter.use('/registrations', registrationRoutes);
apiRouter.use('/gallery', galleryRoutes);
apiRouter.use('/sponsors', sponsorRoutes);
apiRouter.use('/announcements', announcementRoutes);
apiRouter.use('/certificates', certificateRoutes);
apiRouter.use('/cms', cmsRoutes);
apiRouter.use('/contact', contactRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/admin/users', usersRoutes);

