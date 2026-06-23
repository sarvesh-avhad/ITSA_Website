import { Router } from 'express';
import { authenticate, requireRole } from '@/middleware/auth.middleware';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import { createAuditLog } from '@/middleware/audit.middleware';

const router = Router();

// GET all users (Admin only)
router.get('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          permissions: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) { next(err); }
});

// PATCH update user role
router.patch('/:id/role', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { role } = req.body;
    const currentAdminRole = req.user!.role;
    
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new NotFoundError('User');

    // Rule 1: SUPER_ADMIN cannot be modified by anyone except themselves
    if (user.role === 'SUPER_ADMIN' && req.user!.userId !== user.id) {
      return res.status(403).json({ success: false, error: { message: 'Cannot modify Super Admin accounts' } });
    }

    // Rule 2: ADMIN restrictions
    if (currentAdminRole === 'ADMIN') {
      if (user.role === 'ADMIN' && req.user!.userId !== user.id) {
        return res.status(403).json({ success: false, error: { message: 'Cannot modify other Admin accounts' } });
      }
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, error: { message: 'Cannot promote to Admin or Super Admin' } });
      }
    }

    // Clear specific permissions array on any role change to guarantee instant revocation
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { 
        role,
        ...(user.role !== role ? { permissions: [] } : {})
      },
      select: { id: true, email: true, role: true, permissions: true },
    });

    await createAuditLog(req, {
      action: 'UPDATE',
      resource: 'User',
      resourceId: updatedUser.id,
      oldData: { role: user.role },
      newData: { role },
    });

    res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

// PATCH update user permissions
router.patch('/:id/permissions', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { permissions } = req.body; // Expecting array of strings
    const currentAdminRole = req.user!.role;
    
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new NotFoundError('User');

    if (currentAdminRole === 'ADMIN' && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
      return res.status(403).json({ success: false, error: { message: 'Cannot modify Admin or Super Admin permissions' } });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { permissions },
      select: { id: true, email: true, permissions: true },
    });

    await createAuditLog(req, {
      action: 'UPDATE',
      resource: 'User',
      resourceId: updatedUser.id,
      newData: { permissions },
    });

    res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

// POST suspend/unsuspend user
router.post('/:id/suspend', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new NotFoundError('User');

    // Prevent suspending SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: { message: 'Cannot suspend a SUPER_ADMIN' } });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true },
    });

    await createAuditLog(req, {
      action: updatedUser.isActive ? 'UPDATE' : 'DELETE', // Using DELETE as suspend for audit
      resource: 'User',
      resourceId: updatedUser.id,
    });

    res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

export default router;
