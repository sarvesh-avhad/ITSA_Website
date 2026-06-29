import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notifications.service';
import { z } from 'zod';
import { UserRole, NotificationTemplate, NotificationSourceModule } from '@prisma/client';
import { ValidationError } from '@/lib/errors';

// Schema for broadcasting an admin notification
const broadcastSchema = z.object({
  roles: z.array(z.nativeEnum(UserRole)).optional(),
  templateKey: z.nativeEnum(NotificationTemplate),
  sourceModule: z.nativeEnum(NotificationSourceModule),
  metadata: z.any().optional(),
});

export const getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = parseInt(req.query.skip as string) || 0;
    
    // Auth middleware guarantees req.user
    const notifications = await NotificationService.getUserNotifications(
      req.user!.userId, 
      req.user!.role as UserRole,
      limit,
      skip
    );

    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
};

export const getLatest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = 10; // Fixed small limit for Navbar
    const skip = 0;
    
    const notifications = await NotificationService.getUserNotifications(
      req.user!.userId, 
      req.user!.role as UserRole,
      limit,
      skip
    );

    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user!.userId, req.user!.role as UserRole);
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await NotificationService.markAsRead(id, req.user!.userId);
    res.json({ success: true, data: { message: 'Notification marked as read' } });
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user!.userId, req.user!.role as UserRole);
    res.json({ success: true, data: { message: `Marked notifications as read` } });
  } catch (err) {
    next(err);
  }
};

export const markAsUnread = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await NotificationService.markAsUnread(id, req.user!.userId);
    res.json({ success: true, data: { message: 'Notification marked as unread' } });
  } catch (err) {
    next(err);
  }
};

export const hide = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await NotificationService.hideNotification(id, req.user!.userId);
    res.json({ success: true, data: { message: 'Notification hidden successfully' } });
  } catch (err) {
    next(err);
  }
};

export const broadcast = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only SUPER_ADMIN or ADMIN can broadcast, enforced by routes
    const validatedData = broadcastSchema.parse(req.body);
    
    const notification = await NotificationService.broadcast({
      roles: validatedData.roles,
      templateKey: validatedData.templateKey,
      sourceModule: validatedData.sourceModule,
      metadata: validatedData.metadata
    });

    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    if (err instanceof z.ZodError) {
      next(new ValidationError(err.errors[0].message, err.errors));
      return;
    }
    next(err);
  }
};
