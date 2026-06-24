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
    const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!user) throw new NotFoundError('User');

    // Rule 1: SUPER_ADMIN cannot be modified by anyone except themselves or another SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN' && currentAdminRole !== 'SUPER_ADMIN') {
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
      where: { id: req.params.id as string },
      data: { 
        role,
        ...(user.role !== role ? { permissions: [] } : {})
      },
      select: { id: true, email: true, role: true, permissions: true },
    });

    await createAuditLog(req, {
      action: 'ROLE_CHANGED',
      severity: 'WARNING',
      resource: 'User',
      resourceId: updatedUser.id,
      targetUserId: updatedUser.id,
      oldValue: { role: user.role },
      newValue: { role },
    });

    res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

// PATCH update user permissions
router.patch('/:id/permissions', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { permissions } = req.body; // Expecting array of strings
    const currentAdminRole = req.user!.role;
    
    const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!user) throw new NotFoundError('User');

    if (currentAdminRole === 'ADMIN' && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
      return res.status(403).json({ success: false, error: { message: 'Cannot modify Admin or Super Admin permissions' } });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { permissions },
      select: { id: true, email: true, permissions: true },
    });

    const added = permissions.filter((p: string) => !user.permissions.includes(p));
    const removed = user.permissions.filter((p: string) => !permissions.includes(p));

    if (added.length > 0) {
      await createAuditLog(req, {
        action: 'PERMISSION_GRANTED',
        severity: 'WARNING',
        resource: 'User',
        resourceId: updatedUser.id,
        targetUserId: updatedUser.id,
        newValue: { granted: added },
      });
    }
    if (removed.length > 0) {
      await createAuditLog(req, {
        action: 'PERMISSION_REVOKED',
        severity: 'WARNING',
        resource: 'User',
        resourceId: updatedUser.id,
        targetUserId: updatedUser.id,
        oldValue: { revoked: removed },
      });
    }

    res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

// POST suspend/unsuspend user
router.post('/:id/suspend', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!user) throw new NotFoundError('User');

    // Prevent suspending SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: { message: 'Cannot suspend a SUPER_ADMIN' } });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true },
    });

    await createAuditLog(req, {
      action: updatedUser.isActive ? 'USER_REACTIVATED' : 'USER_SUSPENDED',
      severity: 'WARNING',
      resource: 'User',
      resourceId: updatedUser.id,
      targetUserId: updatedUser.id,
    });

    res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

export default router;
