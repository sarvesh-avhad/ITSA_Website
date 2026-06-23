import { Router } from 'express';
import { authenticate, requireRole } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { createAlbumSchema, updateAlbumSchema, paginationSchema } from '@itsa/shared';
import { prisma } from '@/lib/prisma';
import { getCache, setCache, invalidateCacheByPrefix } from '@/lib/redis';
import { NotFoundError } from '@/lib/errors';
import { createAuditLog } from '@/middleware/audit.middleware';
import { CACHE_TTL, PAGINATION } from '@itsa/shared';
import slugify from 'slugify';

const router = Router();

// List albums
router.get('/albums', validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const { page = 1, limit = 12, search } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);
    const cacheKey = `gallery:albums:${JSON.stringify(req.query)}`;

    const cached = await getCache<any>(cacheKey);
    if (cached) return res.json({ success: true, ...cached });

    const where: any = { deletedAt: null, isPublished: true };
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [albums, total] = await Promise.all([
      prisma.galleryAlbum.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [{ year: 'desc' }, { sortOrder: 'asc' }],
        include: { _count: { select: { media: true } }, event: { select: { id: true, title: true } } },
      }),
      prisma.galleryAlbum.count({ where }),
    ]);

    const result = {
      data: albums.map((a: any) => ({ ...a, mediaCount: a._count.media })),
      meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    };

    await setCache(cacheKey, result, CACHE_TTL.GALLERY_ALBUMS);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// Admin List albums
router.get('/admin/albums', authenticate, requireRole('EVENT_COORDINATOR'), validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const { page = 1, limit = 12, search } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { deletedAt: null };
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [albums, total] = await Promise.all([
      prisma.galleryAlbum.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [{ year: 'desc' }, { sortOrder: 'asc' }],
        include: { _count: { select: { media: true } }, event: { select: { id: true, title: true } } },
      }),
      prisma.galleryAlbum.count({ where }),
    ]);

    const result = {
      data: albums.map((a: any) => ({ ...a, mediaCount: a._count.media })),
      meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    };

    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// Get album with media
router.get('/albums/:slug', async (req, res, next) => {
  try {
    const cacheKey = `gallery:album:${(req.params.slug as string)}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const album = await prisma.galleryAlbum.findUnique({
      where: { slug: (req.params.slug as string), deletedAt: null },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        event: { select: { id: true, title: true, slug: true } },
      },
    });

    if (!album) throw new NotFoundError('Album');
    await setCache(cacheKey, album, CACHE_TTL.GALLERY_ALBUMS);
    res.json({ success: true, data: album });
  } catch (err) { next(err); }
});



// Create album
router.post('/albums', authenticate, requireRole('EVENT_COORDINATOR'), validate(createAlbumSchema), async (req, res, next) => {
  try {
    const slug = slugify(req.body.title, { lower: true, strict: true });
    const album = await prisma.galleryAlbum.create({
      data: { ...req.body, slug, isPublished: true },
    });
    await invalidateCacheByPrefix('gallery');
    await createAuditLog(req, { action: 'CREATE', resource: 'GalleryAlbum', resourceId: album.id });
    res.status(201).json({ success: true, data: album });
  } catch (err: any) { 
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, error: { message: 'An album with this title already exists' } });
    }
    next(err); 
  }
});

// Update album
router.patch('/albums/:id', authenticate, requireRole('EVENT_COORDINATOR'), validate(updateAlbumSchema), async (req, res, next) => {
  try {
      const album = await prisma.galleryAlbum.update({ where: { id: (req.params.id as string) }, data: req.body });
    await invalidateCacheByPrefix('gallery');
    await createAuditLog(req, { action: 'UPDATE', resource: 'GalleryAlbum', resourceId: album.id });
    res.json({ success: true, data: album });
  } catch (err) { next(err); }
});

// Delete album
router.delete('/albums/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.galleryAlbum.update({ where: { id: (req.params.id as string) }, data: { deletedAt: new Date() } });
    await invalidateCacheByPrefix('gallery');
    await createAuditLog(req, { action: 'DELETE', resource: 'Album', resourceId: (req.params.id as string) as string });
    res.json({ success: true, data: { message: 'Album deleted' } });
  } catch (err) { next(err); }
});

// Upload media to album
router.post('/albums/:id/media', authenticate, requireRole('EVENT_COORDINATOR'), async (req, res, next) => {
  try {
    const { type = 'IMAGE', url, thumbnailUrl, publicId, width, height, sizeBytes, caption } = req.body;
    const media = await prisma.galleryMedia.create({
      data: { albumId: (req.params.id as string), type, url, thumbnailUrl, publicId, width, height, sizeBytes, caption },
    });
    await invalidateCacheByPrefix('gallery');
    await createAuditLog(req, { action: 'UPLOAD', resource: 'GalleryMedia', resourceId: media.id });
    res.status(201).json({ success: true, data: media });
  } catch (err) { next(err); }
});

// Delete media
router.delete('/media/:id', authenticate, requireRole('EVENT_COORDINATOR'), async (req, res, next) => {
  try {
    await prisma.galleryMedia.delete({ where: { id: (req.params.id as string) } });
    await invalidateCacheByPrefix('gallery');
    res.json({ success: true, data: { message: 'Media deleted' } });
  } catch (err) { next(err); }
});

export default router;
