import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import type { JwtPayload, UserRole } from '@itsa/shared';
import { hasMinimumRole, ROLE_BASE_PERMISSIONS } from '@itsa/shared';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      requestId?: string;
    }
  }
}

/**
 * Middleware to verify JWT access token from Authorization header.
 * Attaches decoded payload to `req.user`.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is required');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Access token has expired'));
    } else if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid access token'));
    } else {
      next(err);
    }
  }
}

/**
 * Optional authentication — attaches user if token is valid, but doesn't reject unauthenticated requests.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    // Invalid token in optional auth — just continue without user
    next();
  }
}

/**
 * Role-based access control middleware.
 * Checks that the authenticated user has at least the specified role.
 */
export function requireRole(minimumRole: UserRole) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }

      const user = await prisma.user.findUnique({ 
        where: { id: req.user.userId }, 
        select: { role: true, isActive: true, permissions: true } 
      });

      if (!user) return next(new UnauthorizedError('User not found'));
      if (!user.isActive) return next(new ForbiddenError('Account is suspended'));

      req.user.role = user.role;
      req.user.permissions = user.permissions;

      if (!hasMinimumRole(req.user.role, minimumRole)) {
        return next(new ForbiddenError(`Requires ${minimumRole} role or higher`));
      }

      next();
    } catch (err) { next(err); }
  };
}

/**
 * Advanced Permissions access control middleware.
 * Grants access if user has the specific permission, OR if they are a SUPER_ADMIN.
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }

      const user = await prisma.user.findUnique({ 
        where: { id: req.user.userId }, 
        select: { role: true, isActive: true, permissions: true } 
      });

      if (!user) return next(new UnauthorizedError('User not found'));
      if (!user.isActive) return next(new ForbiddenError('Account is suspended'));

      req.user.role = user.role;
      req.user.permissions = user.permissions;

      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      const basePermissions = ROLE_BASE_PERMISSIONS[req.user.role as UserRole] || [];
      const userPermissions = req.user.permissions || [];

      if (!basePermissions.includes(permission) && !userPermissions.includes(permission)) {
        return next(new ForbiddenError(`Requires permission: ${permission}`));
      }

      next();
    } catch (err) { next(err); }
  };
}

/**
 * Verify that the user's account is still active in the database.
 * Use sparingly on sensitive operations (not on every request for performance).
 */
export async function verifyActiveUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isActive: true, deletedAt: true },
    });

    if (!user || !user.isActive || user.deletedAt) {
      return next(new ForbiddenError('Account is deactivated'));
    }

    next();
  } catch (err) {
    next(err);
  }
}
