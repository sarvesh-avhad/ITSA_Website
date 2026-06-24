import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@/lib/errors';
import { createAuditLog } from '@/middleware/audit.middleware';
import { sendEmail, welcomeEmail, passwordResetEmail } from '@/lib/email';
import { AUTH } from '@itsa/shared';
import type {
  AuthTokens,
  AuthUser,
  JwtPayload,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from '@itsa/shared';

class AuthService {
  // ============================================================
  // Register
  // ============================================================
  async register(data: RegisterRequest, req: Request): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    if (data.prn) {
      const existingPrn = await prisma.user.findUnique({ where: { prn: data.prn } });
      if (existingPrn) {
        throw new ConflictError('An account with this PRN already exists');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, AUTH.BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        prn: data.prn,
        branch: data.branch,
        customBranch: data.customBranch,
        year: data.year,
        college: data.college,
        customCollege: data.customCollege,
        role: 'STUDENT',
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions, req);

    // Send welcome email (async, don't await)
    const email = welcomeEmail({ name: user.firstName });
    sendEmail({ to: user.email, subject: email.subject, html: email.html }).catch((err) =>
      logger.error({ err }, 'Failed to send welcome email')
    );

    // Audit log
    await createAuditLog(req, {
      action: 'USER_CREATED',
      severity: 'INFO',
      resource: 'User',
      resourceId: user.id,
      targetUserId: user.id,
      newValue: { email: user.email, role: user.role },
    });

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  // ============================================================
  // Login
  // ============================================================
  async login(data: LoginRequest, req: Request, res: Response): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions, req);

    // Set refresh token cookie
    this.setRefreshTokenCookie(res, tokens.refreshToken);


    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  // ============================================================
  // Google OAuth
  // ============================================================
  async googleAuth(credential: string, req: Request, res: Response): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Verify Google token
    const googlePayload = await this.verifyGoogleToken(credential);

    if (!googlePayload || !googlePayload.email) {
      throw new BadRequestError('Invalid Google credential');
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googlePayload.sub }, { email: googlePayload.email }],
      },
    });

    if (user) {
      // Link Google ID if not already linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googlePayload.sub,
            isEmailVerified: true,
            avatarUrl: user.avatarUrl || googlePayload.picture,
          },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googlePayload.email,
          firstName: googlePayload.given_name || 'User',
          lastName: googlePayload.family_name || '',
          googleId: googlePayload.sub,
          avatarUrl: googlePayload.picture,
          isEmailVerified: true,
          role: 'STUDENT',
        },
      });
    }

    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions, req);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  // ============================================================
  // Refresh Token
  // ============================================================
  async refreshToken(req: Request, res: Response): Promise<AuthTokens> {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new UnauthorizedError('Refresh token not found');
    }

    // Verify token in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        // Potential token reuse detected — revoke all tokens for user
        await prisma.refreshToken.updateMany({
          where: { userId: storedToken.userId },
          data: { isRevoked: true },
        });
        logger.warn({ userId: storedToken.userId }, 'Refresh token reuse detected — all tokens revoked');
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = storedToken.user;
    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Rotate: revoke old, create new
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.permissions, req);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return tokens;
  }

  // ============================================================
  // Logout
  // ============================================================
  async logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.refreshToken;

    if (token) {
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { isRevoked: true },
      });
    }

    res.clearCookie('refreshToken');

  }

  // ============================================================
  // Forgot Password
  // ============================================================
  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || !user.passwordHash) return;

    // Generate reset token (store as a short-lived refresh token with special prefix)
    const resetToken = `reset_${uuidv4()}`;
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await prisma.refreshToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    });

    const resetUrl = `${env.CORS_ORIGIN}/auth/reset-password?token=${resetToken}`;
    const emailContent = passwordResetEmail({ name: user.firstName, resetUrl });
    await sendEmail({ to: user.email, ...emailContent });
  }

  // ============================================================
  // Reset Password
  // ============================================================
  async resetPassword(token: string, newPassword: string): Promise<string> {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, AUTH.BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: storedToken.userId },
        data: { passwordHash },
      }),
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      }),
      // Revoke all refresh tokens for security
      prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { isRevoked: true },
      }),
    ]);
    
    return storedToken.userId;
  }

  // ============================================================
  // Profile
  // ============================================================
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        prn: true,
        branch: true,
        customBranch: true,
        year: true,
        college: true,
        customCollege: true,
        avatarUrl: true,
        role: true,
        permissions: true,
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundError('User');
    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileRequest) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        prn: data.prn,
        branch: data.branch,
        customBranch: data.customBranch,
        year: data.year,
        college: data.college,
        customCollege: data.customCollege,
        avatarUrl: data.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        prn: true,
        branch: true,
        customBranch: true,
        year: true,
        college: true,
        customCollege: true,
        avatarUrl: true,
        role: true,
        permissions: true,
        isActive: true,
        isEmailVerified: true,
      },
    });

    return user;
  }

  // ============================================================
  // Helpers
  // ============================================================

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    permissions: string[],
    req: Request
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { userId, email, role: role as any, permissions };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
    });

    const refreshToken = uuidv4();
    const expiresAt = new Date(Date.now() + AUTH.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: AUTH.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });
  }

  private toAuthUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions || [],
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
      phone: user.phone,
      prn: user.prn,
      branch: user.branch,
      customBranch: user.customBranch,
      year: user.year,
      college: user.college,
      customCollege: user.customCollege,
    };
  }

  private async verifyGoogleToken(credential: string): Promise<any> {
    // Use Google's tokeninfo endpoint for verification
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
      );
      if (!response.ok) throw new Error('Invalid token');
      const payload: any = await response.json();

      if (payload.aud !== env.GOOGLE_CLIENT_ID) {
        throw new Error('Token audience mismatch');
      }

      return payload;
    } catch (err) {
      logger.error({ err }, 'Google token verification failed');
      throw new BadRequestError('Invalid Google credential');
    }
  }
}

export const authService = new AuthService();
