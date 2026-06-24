import type { UserRole } from '../types/auth.types';

// ============================================================
// Role Hierarchy
// ============================================================

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  GUEST: 0,
  STUDENT: 1,
  ITSA_MEMBER: 2,
  EVENT_COORDINATOR: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
} as const;

export const ALL_ROLES: UserRole[] = ['GUEST', 'STUDENT', 'ITSA_MEMBER', 'EVENT_COORDINATOR', 'ADMIN', 'SUPER_ADMIN'];

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ============================================================
// Permissions
// ============================================================

export const PERMISSIONS = {
  // Events
  EVENTS_READ: 'events:read',
  EVENTS_CREATE: 'events:create',
  EVENTS_UPDATE: 'events:update',
  EVENTS_DELETE: 'events:delete',
  EVENTS_MANAGE_REGISTRATIONS: 'events:manage_registrations',

  // Gallery
  GALLERY_CREATE: 'gallery:create',
  GALLERY_UPDATE: 'gallery:update',
  GALLERY_DELETE: 'gallery:delete',
  GALLERY_UPLOAD: 'gallery:upload',

  // Sponsors
  SPONSORS_CREATE: 'sponsors:create',
  SPONSORS_UPDATE: 'sponsors:update',
  SPONSORS_DELETE: 'sponsors:delete',

  // Announcements
  ANNOUNCEMENTS_READ: 'announcements:read',
  ANNOUNCEMENTS_CREATE: 'announcements:create',
  ANNOUNCEMENTS_UPDATE: 'announcements:update',
  ANNOUNCEMENTS_DELETE: 'announcements:delete',


  // Users
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_MANAGE_ROLES: 'users:manage_roles',

  // Certificates
  CERTIFICATES_GENERATE: 'certificates:generate',
  CERTIFICATES_MANAGE: 'certificates:manage',

  // CMS
  CMS_UPDATE: 'cms:update',

  // Settings & System
  SETTINGS_MANAGE: 'settings:manage',
  DB_BACKUP_RESTORE: 'db:backup_restore',
  DB_SECURITY_MANAGE: 'db:security_manage',
  AUDIT_LOGS_READ: 'audit_logs:read',

  // Admin
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_EXPORT: 'admin:export',
  ADMIN_AUDIT_LOGS: 'admin:audit_logs',
} as const;

// Values from the PERMISSIONS object
const P = PERMISSIONS;

export const ROLE_BASE_PERMISSIONS: Record<UserRole, string[]> = {
  GUEST: [],
  STUDENT: [],
  ITSA_MEMBER: [
    P.GALLERY_UPLOAD,
    P.GALLERY_CREATE,
    P.ANNOUNCEMENTS_READ,
    P.ANNOUNCEMENTS_CREATE,
    P.ANNOUNCEMENTS_UPDATE,
    P.EVENTS_READ,
  ],
  EVENT_COORDINATOR: [
    P.GALLERY_UPLOAD, P.GALLERY_CREATE,
    P.ANNOUNCEMENTS_READ, P.ANNOUNCEMENTS_CREATE, P.ANNOUNCEMENTS_UPDATE,
    P.EVENTS_READ,
    P.EVENTS_MANAGE_REGISTRATIONS,
    P.CERTIFICATES_GENERATE,
  ],
  ADMIN: [
    P.EVENTS_READ, P.EVENTS_CREATE, P.EVENTS_UPDATE, P.EVENTS_DELETE, P.EVENTS_MANAGE_REGISTRATIONS,
    P.GALLERY_CREATE, P.GALLERY_UPDATE, P.GALLERY_DELETE, P.GALLERY_UPLOAD,
    P.SPONSORS_CREATE, P.SPONSORS_UPDATE, P.SPONSORS_DELETE,
    P.ANNOUNCEMENTS_READ, P.ANNOUNCEMENTS_CREATE, P.ANNOUNCEMENTS_UPDATE, P.ANNOUNCEMENTS_DELETE,
    P.CERTIFICATES_GENERATE, P.CERTIFICATES_MANAGE,
    P.USERS_READ, P.USERS_UPDATE, P.USERS_MANAGE_ROLES,
    P.CMS_UPDATE,
  ],
  SUPER_ADMIN: Object.values(PERMISSIONS),
};

export const RESTRICTED_PERMISSIONS = [
  PERMISSIONS.AUDIT_LOGS_READ,
  PERMISSIONS.SETTINGS_MANAGE,
  PERMISSIONS.DB_BACKUP_RESTORE,
  PERMISSIONS.DB_SECURITY_MANAGE,
  PERMISSIONS.ADMIN_AUDIT_LOGS,
];

// ============================================================
// Application Constants
// ============================================================

export const APP_NAME = 'ITSA Platform';
export const APP_DESCRIPTION = 'Information Technology Students Association — Official Platform';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
  ADMIN_DEFAULT_LIMIT: 25,
} as const;

export const AUTH = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  BCRYPT_ROUNDS: 12,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
} as const;

export const UPLOAD = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 500 * 1024 * 1024, // 500MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  MAX_BULK_UPLOAD: 50,
} as const;

export const CACHE_TTL = {
  EVENTS_LIST: 300,      // 5 min
  EVENT_DETAIL: 600,     // 10 min
  GALLERY_ALBUMS: 900,   // 15 min
  SPONSORS: 1800,        // 30 min
  CMS_CONFIG: 3600,      // 60 min
  SEARCH: 120,           // 2 min
  ANALYTICS: 300,        // 5 min
} as const;

export const CERTIFICATE_ID_PREFIX = 'ITSA';

export const BRANCHES = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Artificial Intelligence & Data Science',
  'Computer Science & Engineering (AI/ML)',
] as const;

export const YEARS = [1, 2, 3, 4] as const;
