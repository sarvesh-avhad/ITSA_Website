import { z } from 'zod';
import { AUTH } from '../constants';

// ============================================================
// Auth Validators
// ============================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(AUTH.PASSWORD_MIN_LENGTH, `Password must be at least ${AUTH.PASSWORD_MIN_LENGTH} characters`)
    .max(AUTH.PASSWORD_MAX_LENGTH, `Password must be at most ${AUTH.PASSWORD_MAX_LENGTH} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().regex(/^[+]?[\d\s-]{10,15}$/, 'Invalid phone number').optional(),
  prn: z.string().min(1).max(50).optional(),
  branch: z.string().min(1).max(100).optional(),
  year: z.number().int().min(1).max(4).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(AUTH.PASSWORD_MIN_LENGTH)
    .max(AUTH.PASSWORD_MAX_LENGTH)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^[+]?[\d\s-]{10,15}$/).optional(),
  prn: z.string().min(1).max(50).optional(),
  branch: z.string().min(1).max(100).optional(),
  year: z.number().int().min(1).max(4).optional(),
  avatarUrl: z.string().url().optional(),
});

// ============================================================
// Event Validators
// ============================================================

const baseEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().max(300).optional(),
  rules: z.string().optional(),
  faqs: z.array(z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
  })).optional(),
  schedule: z.array(z.object({
    time: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
  })).optional(),
  bannerUrl: z.string().url().optional(),
  posterUrl: z.string().url().optional(),
  venue: z.string().max(200).optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid datetime' }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid datetime' }),
  registrationDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid datetime' }).optional(),
  maxParticipants: z.number().int().positive().optional(),
  eventType: z.enum(['INDIVIDUAL', 'TEAM', 'BOTH']),
  categoryId: z.string().cuid().optional(),
  maxTeamSize: z.number().int().min(2).max(10).optional(),
  minTeamSize: z.number().int().min(1).max(10).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const createEventSchema = baseEventSchema.refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);

export const updateEventSchema = baseEventSchema.partial().extend({
  status: z.enum(['DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
});

export const eventFiltersSchema = z.object({
  status: z.enum(['DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
  categoryId: z.string().cuid().optional(),
  eventType: z.enum(['INDIVIDUAL', 'TEAM', 'BOTH']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  sortBy: z.enum(['startDate', 'createdAt', 'title']).default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================
// Registration Validators
// ============================================================

export const individualRegistrationSchema = z.object({
  eventId: z.string().cuid(),
  formData: z.record(z.unknown()).optional(),
});

export const teamRegistrationSchema = z.object({
  eventId: z.string().cuid(),
  teamName: z.string().min(1, 'Team name is required').max(100),
  memberEmails: z.array(z.string().email()).min(1, 'At least one team member is required').max(4),
  formData: z.record(z.unknown()).optional(),
});

// ============================================================
// Gallery Validators
// ============================================================

export const createAlbumSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  coverUrl: z.string().url().optional(),
  eventId: z.string().cuid().optional(),
  year: z.number().int().min(2000).max(2100),
  isPublished: z.boolean().optional(),
});

export const updateAlbumSchema = createAlbumSchema.partial().extend({
  sortOrder: z.number().int().min(0).optional(),
});

// ============================================================
// Sponsor Validators
// ============================================================

export const createSponsorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  logoUrl: z.string().url('Invalid logo URL'),
  description: z.string().max(2000).optional(),
  websiteUrl: z.string().url('Invalid website URL').optional(),
  tier: z.enum(['TITLE', 'GOLD', 'SILVER', 'BRONZE', 'ASSOCIATE']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateSponsorSchema = createSponsorSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ============================================================
// Blog & Announcement Validators
// ============================================================

export const createBlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500).optional(),
  coverUrl: z.string().url().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  isFeatured: z.boolean().optional(),
  categoryId: z.string().cuid().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDesc: z.string().max(160).optional(),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500).optional(),
  category: z.enum(['NOTICE', 'CLUB_UPDATE', 'PLACEMENT_DRIVE', 'WORKSHOP', 'GENERAL']),
  isPinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

// ============================================================
// Contact Validator
// ============================================================

export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[+]?[\d\s-]{10,15}$/).optional(),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
});

// ============================================================
// Certificate Validators
// ============================================================

export const generateCertificatesSchema = z.object({
  eventId: z.string().cuid(),
  templateId: z.string().cuid(),
  recipients: z.array(z.object({
    userId: z.string().cuid(),
    studentName: z.string().min(1),
    position: z.string().optional(),
  })).min(1, 'At least one recipient is required'),
});

// ============================================================
// Search Validator
// ============================================================

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200),
  type: z.enum(['event', 'album', 'sponsor', 'announcement', 'blog']).optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// ============================================================
// Pagination Validator
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(200).optional(),
});


