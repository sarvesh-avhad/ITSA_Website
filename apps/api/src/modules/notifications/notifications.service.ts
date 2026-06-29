import { 
  NotificationType, 
  NotificationCategory, 
  NotificationPriority, 
  NotificationTemplate, 
  NotificationSourceModule, 
  UserRole,
  NotificationRecipientType,
  Prisma
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================================
// TEMPLATE ENGINE
// ============================================================

export interface BaseTemplateData {
  title: string;
  message: string;
  iconKey?: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
}

export const getTemplateData = (template: NotificationTemplate, metadata: any = {}): BaseTemplateData => {
  switch (template) {
    // AUTH
    case NotificationTemplate.WELCOME:
      return {
        title: 'Welcome to ITSA',
        message: 'Your account has been successfully created. Explore upcoming events and updates!',
        iconKey: 'party-popper',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.AUTH,
        priority: NotificationPriority.NORMAL,
      };
    case NotificationTemplate.PASSWORD_RESET:
      return {
        title: 'Password Reset Requested',
        message: 'A password reset was requested for your account. If you did not request this, ignore the email.',
        iconKey: 'shield-alert',
        type: NotificationType.INFO,
        category: NotificationCategory.AUTH,
        priority: NotificationPriority.HIGH,
      };
    case NotificationTemplate.PASSWORD_CHANGED:
      return {
        title: 'Password Changed Successfully',
        message: 'Your password was recently changed. If this wasn\'t you, please contact support immediately.',
        iconKey: 'shield-alert',
        type: NotificationType.WARNING,
        category: NotificationCategory.AUTH,
        priority: NotificationPriority.URGENT,
      };
      
    // USERS
    case NotificationTemplate.ROLE_UPDATED:
      return {
        title: metadata.targetUserName 
          ? `User Role Changed: ${metadata.targetUserName}` 
          : 'Your Role Has Been Updated',
        message: metadata.targetUserName 
          ? `${metadata.targetUserName}'s role was changed from ${metadata.oldRole} to ${metadata.newRole} by ${metadata.updatedBy}.`
          : `Your account role has been changed from ${metadata.oldRole} to ${metadata.newRole}.`,
        iconKey: 'user-cog',
        type: NotificationType.INFO,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.HIGH,
      };

    // EVENTS
    case NotificationTemplate.EVENT_CREATED:
      return {
        title: `New Event: ${metadata.title}`,
        message: metadata.shortDescription || 'A new event has been scheduled. Check it out and register!',
        iconKey: 'calendar-plus',
        type: NotificationType.INFO,
        category: NotificationCategory.EVENT,
        priority: NotificationPriority.NORMAL,
        actionUrl: `/events/${metadata.slug}`,
        actionLabel: 'View Event'
      };
    case NotificationTemplate.EVENT_CANCELLED:
      return {
        title: `Event Cancelled: ${metadata.title}`,
        message: 'We regret to inform you that this event has been cancelled.',
        iconKey: 'calendar-off',
        type: NotificationType.ERROR,
        category: NotificationCategory.EVENT,
        priority: NotificationPriority.URGENT,
      };
    case NotificationTemplate.EVENT_DEADLINE_EXTENDED:
      return {
        title: `Registration Extended: ${metadata.title}`,
        message: `Good news! The registration deadline for ${metadata.title} has been extended to ${metadata.newDeadline}.`,
        iconKey: 'calendar-clock',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.EVENT,
        priority: NotificationPriority.NORMAL,
        actionUrl: `/events/${metadata.slug}`,
        actionLabel: 'Register Now'
      };

    // REGISTRATIONS
    case NotificationTemplate.REGISTRATION_SUCCESS:
      return {
        title: 'Registration Successful',
        message: `You have successfully registered for ${metadata.eventTitle}.`,
        iconKey: 'ticket-check',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.REGISTRATION,
        priority: NotificationPriority.HIGH,
        actionUrl: `/events/${metadata.eventSlug}`,
        actionLabel: 'View Event'
      };
    case NotificationTemplate.TEAM_REGISTRATION_SUCCESS:
      return {
        title: 'Team Registration Successful',
        message: `Your team "${metadata.teamName}" has been successfully registered for ${metadata.eventTitle}.`,
        iconKey: 'users',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.REGISTRATION,
        priority: NotificationPriority.HIGH,
        actionUrl: `/events/${metadata.eventSlug}`,
        actionLabel: 'View Event'
      };
    case NotificationTemplate.REGISTRATION_APPROVED:
      return {
        title: 'Registration Approved',
        message: `Your registration for ${metadata.eventTitle} has been approved by an administrator!`,
        iconKey: 'check-circle',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.REGISTRATION,
        priority: NotificationPriority.HIGH,
        actionUrl: `/events/${metadata.eventSlug}`,
        actionLabel: 'View Ticket'
      };
    case NotificationTemplate.REGISTRATION_REJECTED:
      return {
        title: 'Registration Rejected',
        message: `Your registration for ${metadata.eventTitle} was not approved. Contact support for details.`,
        iconKey: 'x-circle',
        type: NotificationType.ERROR,
        category: NotificationCategory.REGISTRATION,
        priority: NotificationPriority.HIGH,
      };
    case NotificationTemplate.REGISTRATION_CANCELLED:
      return {
        title: 'Registration Cancelled',
        message: `Your registration for ${metadata.eventTitle} has been cancelled.`,
        iconKey: 'ban',
        type: NotificationType.WARNING,
        category: NotificationCategory.REGISTRATION,
        priority: NotificationPriority.HIGH,
      };
    case NotificationTemplate.NEW_REGISTRATION_RECEIVED:
      return {
        title: 'New Event Registration',
        message: `${metadata.userName} just registered for ${metadata.eventTitle}.`,
        iconKey: 'ticket-check',
        type: NotificationType.INFO,
        category: NotificationCategory.REGISTRATION,
        priority: NotificationPriority.NORMAL,
        actionUrl: `/admin/events`,
        actionLabel: 'View Registrations'
      };

    // CERTIFICATES
    case NotificationTemplate.CERTIFICATE_READY:
      return {
        title: 'Certificate Available',
        message: `Your certificate for ${metadata.eventTitle} is ready to download!`,
        iconKey: 'award',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.CERTIFICATE,
        priority: NotificationPriority.HIGH,
        actionUrl: `/certificates/${metadata.certificateId}`,
        actionLabel: 'Download'
      };

    // ANNOUNCEMENTS
    case NotificationTemplate.ANNOUNCEMENT_CREATED:
      return {
        title: `Announcement: ${metadata.title}`,
        message: metadata.shortDescription || 'A new announcement has been posted.',
        iconKey: 'megaphone',
        type: NotificationType.INFO,
        category: NotificationCategory.ANNOUNCEMENT,
        priority: NotificationPriority.NORMAL,
        actionUrl: '/announcements',
        actionLabel: 'Read More'
      };

    // CONTACT
    case NotificationTemplate.NEW_CONTACT_SUBMISSION:
      return {
        title: 'New Contact Form Submission',
        message: `${metadata.name} sent a message regarding: ${metadata.subject}.`,
        iconKey: 'users',
        type: NotificationType.INFO,
        category: NotificationCategory.CONTACT,
        priority: NotificationPriority.NORMAL,
        actionUrl: '/admin/contact',
        actionLabel: 'View Message'
      };
    case NotificationTemplate.CONTACT_REPLY_SENT:
      return {
        title: 'Reply to Your Message',
        message: `We have replied to your message regarding "${metadata.subject}". Please check your email.`,
        iconKey: 'check-circle',
        type: NotificationType.SUCCESS,
        category: NotificationCategory.CONTACT,
        priority: NotificationPriority.NORMAL,
      };

    // BROADCASTS
    case NotificationTemplate.BROADCAST_MESSAGE:
      return {
        title: metadata.title || 'Important Broadcast',
        message: metadata.message,
        iconKey: 'megaphone',
        type: NotificationType.INFO,
        category: NotificationCategory.SYSTEM,
        priority: metadata.priority || NotificationPriority.NORMAL,
        actionUrl: metadata.actionUrl || undefined,
        actionLabel: metadata.actionLabel || undefined
      };

    // SYSTEM
    case NotificationTemplate.SYSTEM_MAINTENANCE:
      return {
        title: 'System Maintenance Scheduled',
        message: metadata.message || 'The platform will undergo maintenance soon. Expect brief downtime.',
        iconKey: 'user-cog',
        type: NotificationType.WARNING,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.URGENT,
      };
    case NotificationTemplate.SYSTEM_SECURITY_ALERT:
      return {
        title: 'Security Alert',
        message: metadata.message || 'A security event has been detected on your account or the platform.',
        iconKey: 'shield-alert',
        type: NotificationType.ERROR,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.URGENT,
      };
    case NotificationTemplate.SYSTEM_ERROR:
      return {
        title: 'System Error / Alert',
        message: metadata.message || 'An internal system error has occurred.',
        iconKey: 'shield-alert',
        type: NotificationType.ERROR,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.URGENT,
      };

    default:
      return {
        title: 'System Notification',
        message: 'You have a new system notification.',
        iconKey: 'bell',
        type: NotificationType.INFO,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.LOW,
      };
  }
};

// ============================================================
// SERVICE CLASS
// ============================================================

interface SendNotificationParams {
  userId: string;
  templateKey: NotificationTemplate;
  sourceModule: NotificationSourceModule;
  metadata?: any;
}

interface BroadcastNotificationParams {
  roles?: UserRole[]; // If empty, treats as GLOBAL
  templateKey: NotificationTemplate;
  sourceModule: NotificationSourceModule;
  metadata?: any;
}

export class NotificationService {
  
  /**
   * Internal deduplication check. 
   * Blocks identical templates sent to the same user within 1 minute.
   */
  private static async isDuplicate(userId: string, templateKey: NotificationTemplate): Promise<boolean> {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        templateKey,
        createdAt: { gte: oneMinuteAgo }
      }
    });
    return !!existing;
  }

  /**
   * Sends a targeted 1:1 notification to a specific user.
   */
  static async send({ userId, templateKey, sourceModule, metadata }: SendNotificationParams) {
    if (await this.isDuplicate(userId, templateKey)) {
      console.warn(`[NotificationService] Suppressed duplicate ${templateKey} for user ${userId}`);
      return null;
    }

    const templateData = getTemplateData(templateKey, metadata);

    return prisma.notification.create({
      data: {
        recipientType: NotificationRecipientType.USER,
        userId,
        templateKey,
        sourceModule,
        title: templateData.title,
        message: templateData.message,
        iconKey: templateData.iconKey,
        type: templateData.type,
        category: templateData.category,
        priority: templateData.priority,
        actionUrl: templateData.actionUrl,
        actionLabel: templateData.actionLabel,
        metadata: metadata || Prisma.JsonNull,
      }
    });
  }

  /**
   * Broadcasts a 1:N notification to specific roles or globally.
   */
  static async broadcast({ roles, templateKey, sourceModule, metadata }: BroadcastNotificationParams) {
    const templateData = getTemplateData(templateKey, metadata);
    const isGlobal = !roles || roles.length === 0;

    return prisma.notification.create({
      data: {
        recipientType: isGlobal ? NotificationRecipientType.GLOBAL : NotificationRecipientType.ROLE,
        targetRoles: isGlobal ? [] : roles,
        templateKey,
        sourceModule,
        title: templateData.title,
        message: templateData.message,
        iconKey: templateData.iconKey,
        type: templateData.type,
        category: templateData.category,
        priority: templateData.priority,
        actionUrl: templateData.actionUrl,
        actionLabel: templateData.actionLabel,
        metadata: metadata || Prisma.JsonNull,
      }
    });
  }

  /**
   * Gets aggregated notifications for a user (USER + ROLE + GLOBAL).
   */
  static async getUserNotifications(userId: string, role: UserRole, limit = 10, skip = 0) {
    const now = new Date();
    const notifications = await prisma.notification.findMany({
      where: {
        deletedAt: null,
        isArchived: false,
        sendAt: { lte: now },
        NOT: { hiddenBy: { has: userId } },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ],
        AND: [
          {
            OR: [
              { recipientType: NotificationRecipientType.USER, userId },
              { recipientType: NotificationRecipientType.GLOBAL },
              { recipientType: NotificationRecipientType.ROLE, targetRoles: { has: role } }
            ]
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip
    });

    const notificationIds = notifications.map(n => n.id);
    const reads = await prisma.notificationRead.findMany({
      where: {
        userId,
        notificationId: { in: notificationIds }
      }
    });
    
    const readMap = new Set(reads.map(r => r.notificationId));

    return notifications.map(n => ({
      ...n,
      isRead: readMap.has(n.id)
    }));
  }

  /**
   * Lightweight count of unread notifications
   */
  static async getUnreadCount(userId: string, role: UserRole): Promise<number> {
    const now = new Date();
    
    const totalCount = await prisma.notification.count({
      where: {
        deletedAt: null,
        isArchived: false,
        sendAt: { lte: now },
        NOT: { hiddenBy: { has: userId } },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ],
        AND: [
          {
            OR: [
              { recipientType: NotificationRecipientType.USER, userId },
              { recipientType: NotificationRecipientType.GLOBAL },
              { recipientType: NotificationRecipientType.ROLE, targetRoles: { has: role } }
            ]
          }
        ],
        reads: {
          none: { userId }
        }
      }
    });

    return totalCount;
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notificationRead.upsert({
      where: {
        notificationId_userId: { notificationId, userId }
      },
      update: {},
      create: {
        notificationId,
        userId
      }
    });
  }

  /**
   * Mark a single notification as unread
   */
  static async markAsUnread(notificationId: string, userId: string) {
    return prisma.notificationRead.deleteMany({
      where: { notificationId, userId }
    });
  }

  /**
   * Hide a notification for a user
   */
  static async hideNotification(notificationId: string, userId: string) {
    // Note: Due to lack of strongly typed generated client in dev without restart,
    // we use a direct update, assuming hiddenBy exists.
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        hiddenBy: { push: userId }
      }
    });
  }

  /**
   * Mark all visible notifications as read for a user
   */
  static async markAllAsRead(userId: string, role: UserRole) {
    const now = new Date();
    
    const unreadIds = await prisma.notification.findMany({
      where: {
        deletedAt: null,
        isArchived: false,
        sendAt: { lte: now },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ],
        AND: [
          {
            OR: [
              { recipientType: NotificationRecipientType.USER, userId },
              { recipientType: NotificationRecipientType.GLOBAL },
              { recipientType: NotificationRecipientType.ROLE, targetRoles: { has: role } }
            ]
          }
        ],
        reads: {
          none: { userId }
        }
      },
      select: { id: true }
    });

    if (unreadIds.length === 0) return { count: 0 };

    const result = await prisma.notificationRead.createMany({
      data: unreadIds.map(n => ({
        notificationId: n.id,
        userId
      })),
      skipDuplicates: true
    });

    return { count: result.count };
  }
}
