import { Router } from 'express';
import * as notificationsController from './notifications.controller';
import { authenticate, requireRole } from '@/middleware/auth.middleware';

const router = Router();

// ============================================================
// USER ROUTES (Protected)
// ============================================================

// Get unread count (highly optimized)
router.get('/unread-count', authenticate, notificationsController.getUnreadCount);

// Get latest 10 for navbar
router.get('/latest', authenticate, notificationsController.getLatest);

// Get paginated history
router.get('/', authenticate, notificationsController.getUserNotifications);

// Mark specific notification as read
router.post('/read/:id', authenticate, notificationsController.markAsRead);

// Mark specific notification as unread
router.post('/unread/:id', authenticate, notificationsController.markAsUnread);

// Mark all as read
router.post('/read-all', authenticate, notificationsController.markAllAsRead);

// Hide/Delete notification for user
router.delete('/:id', authenticate, notificationsController.hide);

// ============================================================
// ADMIN ROUTES
// ============================================================

// Broadcast notification (Super Admin / Admin only)
router.post('/broadcast', authenticate, requireRole('ADMIN'), notificationsController.broadcast);

export default router;
