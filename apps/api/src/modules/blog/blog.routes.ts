import { Router } from 'express';
import { authenticate, requireRole } from '@/middleware/auth.middleware';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { createBlogPostSchema, updateBlogPostSchema, paginationSchema } from '@itsa/shared';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import { createAuditLog } from '@/middleware/audit.middleware';
import slugify from 'slugify';

const router = Router();

// List published posts
router.get('/posts', validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const { page = 1, limit = 12, search } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { deletedAt: null, status: 'PUBLISHED' };
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          category: true,
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    res.json({
      success: true,
      data: posts,
      meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
});

// Get post by slug
router.get('/posts/:slug', async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug, deletedAt: null },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        category: true,
      },
    });
    if (!post) throw new NotFoundError('Blog Post');

    // Increment view count
    await prisma.blogPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } });

    res.json({ success: true, data: post });
  } catch (err) { next(err); }
});

// List categories
router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.blogCategory.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
});

// Create post
router.post('/posts', authenticate, requireRole('COORDINATOR'), validate(createBlogPostSchema), async (req, res, next) => {
  try {
    const slug = slugify(req.body.title, { lower: true, strict: true }) + '-' + Date.now();
    const readTime = Math.ceil(req.body.content.split(/\s+/).length / 200); // ~200 wpm

    const post = await prisma.blogPost.create({
      data: {
        ...req.body,
        slug,
        readTime,
        authorId: req.user!.userId,
        publishedAt: req.body.status === 'PUBLISHED' ? new Date() : null,
      },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
    await createAuditLog(req, { action: 'CREATE', resource: 'BlogPost', resourceId: post.id });
    res.status(201).json({ success: true, data: post });
  } catch (err) { next(err); }
});

// Update post
router.patch('/posts/:id', authenticate, requireRole('COORDINATOR'), validate(updateBlogPostSchema), async (req, res, next) => {
  try {
    const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Blog Post');

    const data: any = { ...req.body };
    if (req.body.content) data.readTime = Math.ceil(req.body.content.split(/\s+/).length / 200);
    if (req.body.status === 'PUBLISHED' && !existing.publishedAt) data.publishedAt = new Date();

    const post = await prisma.blogPost.update({ where: { id: req.params.id }, data });
    await createAuditLog(req, { action: 'UPDATE', resource: 'BlogPost', resourceId: post.id });
    res.json({ success: true, data: post });
  } catch (err) { next(err); }
});

// Delete post
router.delete('/posts/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.blogPost.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    await createAuditLog(req, { action: 'DELETE', resource: 'BlogPost', resourceId: req.params.id as string });
    res.json({ success: true, data: { message: 'Post deleted' } });
  } catch (err) { next(err); }
});

// Publish/unpublish
router.patch('/posts/:id/publish', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const post = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
    if (!post) throw new NotFoundError('Blog Post');

    const newStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const updated = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: { status: newStatus as any, publishedAt: newStatus === 'PUBLISHED' ? new Date() : post.publishedAt },
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

export default router;
