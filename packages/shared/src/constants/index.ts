import type { UserRole } from '../types/auth.types';

// ============================================================
// Role Hierarchy
// ============================================================

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  VISITOR: 0,
  STUDENT: 1,
  COORDINATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
} as const;

export const ALL_ROLES: UserRole[] = ['VISITOR', 'STUDENT', 'COORDINATOR', 'ADMIN', 'SUPER_ADMIN'];

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ============================================================
// Permissions
// ============================================================

export const PERMISSIONS = {
  // Events
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

  // Admin
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_EXPORT: 'admin:export',
  ADMIN_AUDIT_LOGS: 'admin:audit_logs',
} as const;

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
