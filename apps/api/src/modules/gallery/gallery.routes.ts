import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { createAlbumSchema, updateAlbumSchema, paginationSchema, PERMISSIONS } from '@itsa/shared';
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
        include: { 
          _count: { select: { media: true } }, 
          event: { select: { id: true, title: true } },
          media: { take: 1, orderBy: { createdAt: 'asc' }, select: { url: true } } 
        },
      }),
      prisma.galleryAlbum.count({ where }),
    ]);

    const result = {
      data: albums.map((a: any) => {
        const fallbackCover = a.media && a.media.length > 0 ? a.media[0].url : null;
        return { 
          ...a, 
          mediaCount: a._count.media,
          coverImageUrl: a.coverImageUrl || a.coverUrl || fallbackCover,
          media: undefined // hide from public payload if desired, or leave it
        };
      }),
      meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    };

    await setCache(cacheKey, result, CACHE_TTL.GALLERY_ALBUMS);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// Admin List albums
router.get('/admin/albums', authenticate, requireRole('ITSA_MEMBER'), validateQuery(paginationSchema), async (req, res, next) => {
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
        include: { 
          _count: { select: { media: true } }, 
          event: { select: { id: true, title: true } },
          media: { take: 1, orderBy: { createdAt: 'asc' }, select: { url: true } } 
        },
      }),
      prisma.galleryAlbum.count({ where }),
    ]);

    const result = {
      data: albums.map((a: any) => {
        const fallbackCover = a.media && a.media.length > 0 ? a.media[0].url : null;
        return { 
          ...a, 
          mediaCount: a._count.media,
          coverImageUrl: a.coverImageUrl || a.coverUrl || fallbackCover,
          media: undefined
        };
      }),
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
router.post('/albums', authenticate, requirePermission(PERMISSIONS.GALLERY_CREATE), validate(createAlbumSchema), async (req, res, next) => {
  try {
    let baseSlug = slugify(req.body.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.galleryAlbum.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const album = await prisma.galleryAlbum.create({
      data: { ...req.body, slug, isPublished: true },
    });
    await invalidateCacheByPrefix('gallery');
    await createAuditLog(req, { 
      action: 'ALBUM_CREATED', 
      severity: 'INFO',
      resource: 'GalleryAlbum', 
      resourceId: album.id,
      newValue: { title: album.title }
    });
    res.status(201).json({ success: true, data: album });
  } catch (err: any) { 
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, error: { message: 'An album with this title already exists' } });
    }
    next(err); 
  }
});

// Update album
router.patch('/albums/:id', authenticate, requirePermission(PERMISSIONS.GALLERY_UPDATE), validate(updateAlbumSchema), async (req, res, next) => {
  try {
    const existing = await prisma.galleryAlbum.findUnique({ where: { id: (req.params.id as string) } });
    if (!existing) return res.status(404).json({ success: false, error: { message: 'Album not found' } });
    const album = await prisma.galleryAlbum.update({ where: { id: (req.params.id as string) }, data: req.body });
    await invalidateCacheByPrefix('gallery');
    await createAuditLog(req, { 
      action: 'ALBUM_UPDATED', 
      severity: 'INFO',
      resource: 'GalleryAlbum', 
      resourceId: album.id,
      oldValue: { title: existing.title },
      newValue: { title: album.title }
    });
    res.json({ success: true, data: album });
  } catch (err) { next(err); }
});

// Delete album
router.delete('/albums/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const album = await prisma.galleryAlbum.findUnique({ where: { id: (req.params.id as string) } });
    if (!album) return res.status(404).json({ success: false, error: { message: 'Album not found' } });
    await prisma.galleryAlbum.update({ where: { id: (req.params.id as string) }, data: { deletedAt: new Date() } });
    await invalidateCacheByPrefix('gallery');
    await createAuditLog(req, { 
      action: 'ALBUM_DELETED', 
      severity: 'WARNING',
      resource: 'GalleryAlbum', 
      resourceId: (req.params.id as string) as string,
      oldValue: { title: album.title }
    });
    res.json({ success: true, data: { message: 'Album deleted' } });
  } catch (err) { next(err); }
});

// Upload media to album
router.post('/albums/:id/media', authenticate, requirePermission(PERMISSIONS.GALLERY_UPLOAD), async (req, res, next) => {
  try {
    const { type = 'IMAGE', url, thumbnailUrl, publicId, width, height, sizeBytes, caption } = req.body;
    const media = await prisma.galleryMedia.create({
      data: { albumId: (req.params.id as string), type, url, thumbnailUrl, publicId, width, height, sizeBytes, caption },
      include: { album: { select: { title: true } } }
    });
    await invalidateCacheByPrefix('gallery');
    await createAuditLog(req, { 
      action: 'MEDIA_UPLOADED', 
      severity: 'INFO',
      resource: 'GalleryMedia', 
      resourceId: media.id,
      newValue: { type, publicId, albumName: media.album.title }
    });
    res.status(201).json({ success: true, data: media });
  } catch (err) { next(err); }
});

// Delete media
router.delete('/media/:id', authenticate, requirePermission(PERMISSIONS.GALLERY_DELETE), async (req, res, next) => {
  try {
    const media = await prisma.galleryMedia.findUnique({ 
      where: { id: (req.params.id as string) },
      include: { album: { select: { title: true } } }
    });
    if (!media) return res.status(404).json({ success: false, error: { message: 'Media not found' } });
    await prisma.galleryMedia.delete({ where: { id: (req.params.id as string) } });
    await invalidateCacheByPrefix('gallery');
    await createAuditLog(req, { 
      action: 'MEDIA_DELETED', 
      severity: 'WARNING',
      resource: 'GalleryMedia', 
      resourceId: req.params.id as string,
      oldValue: { type: media.type, publicId: media.publicId, albumName: media.album.title }
    });
    res.json({ success: true, data: { message: 'Media deleted' } });
  } catch (err) { next(err); }
});

export default router;
