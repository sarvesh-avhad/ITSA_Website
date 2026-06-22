// ============================================================
// Blog Types
// ============================================================

export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverUrl: string | null;
  status: PostStatus;
  isFeatured: boolean;
  publishedAt: string | null;
  authorId: string;
  categoryId: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  readTime: number | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author?: BlogAuthor;
  category?: BlogCategory | null;
}

export interface BlogAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface CreateBlogPostRequest {
  title: string;
  content: string;
  excerpt?: string;
  coverUrl?: string;
  status?: PostStatus;
  isFeatured?: boolean;
  categoryId?: string;
  metaTitle?: string;
  metaDesc?: string;
}

export interface UpdateBlogPostRequest extends Partial<CreateBlogPostRequest> {}

// ============================================================
// Announcement Types
// ============================================================

export type AnnouncementCategory = 'NOTICE' | 'CLUB_UPDATE' | 'PLACEMENT_DRIVE' | 'WORKSHOP' | 'GENERAL';

export interface Announcement {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: AnnouncementCategory;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  excerpt?: string;
  category: AnnouncementCategory;
  isPinned?: boolean;
  isPublished?: boolean;
}

export interface UpdateAnnouncementRequest extends Partial<CreateAnnouncementRequest> {}

// ============================================================
// Certificate Types
// ============================================================

export interface Certificate {
  id: string;
  certificateId: string;
  userId: string;
  eventId: string;
  studentName: string;
  eventName: string;
  date: string;
  position: string | null;
  pdfUrl: string | null;
  isDownloaded: boolean;
  downloadCount: number;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
  event?: { title: string; slug: string };
}

export interface CertificateTemplate {
  id: string;
  name: string;
  htmlTemplate: string;
  cssStyles: string | null;
  placeholders: string[];
  thumbnailUrl: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface GenerateCertificatesRequest {
  eventId: string;
  templateId: string;
  recipients: CertificateRecipient[];
}

export interface CertificateRecipient {
  userId: string;
  studentName: string;
  position?: string;
}

export interface VerifyCertificateResponse {
  isValid: boolean;
  certificate?: {
    certificateId: string;
    studentName: string;
    eventName: string;
    date: string;
    position: string | null;
  };
}

// ============================================================
// Contact Types
// ============================================================

export type ContactStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  userId: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// ============================================================
// CMS Types
// ============================================================

export interface SiteConfig {
  id: string;
  key: string;
  value: unknown;
  section: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSiteConfigRequest {
  configs: Array<{
    key: string;
    value: unknown;
  }>;
}

// ============================================================
// Search Types
// ============================================================

export type SearchResultType = 'event' | 'album' | 'sponsor' | 'announcement' | 'blog';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  url: string;
}

export interface SearchParams {
  q: string;
  type?: SearchResultType;
  limit?: number;
}

// ============================================================
// Analytics Types
// ============================================================

export interface DashboardAnalytics {
  totalUsers: number;
  totalEvents: number;
  totalRegistrations: number;
  totalAlbums: number;
  recentRegistrations: Registration[];
  upcomingEvents: EventListItem[];
  registrationsByMonth: ChartDataPoint[];
  usersByRole: ChartDataPoint[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

// Re-import for convenience
import type { Registration } from './registration.types';
import type { EventListItem } from './event.types';

// ============================================================
// Audit Log Types
// ============================================================

export type AuditAction = 
  | 'CREATE' | 'UPDATE' | 'DELETE' 
  | 'LOGIN' | 'LOGOUT' 
  | 'EXPORT' | 'APPROVE' | 'REJECT' 
  | 'UPLOAD' | 'DOWNLOAD';

export interface AuditLog {
  id: string;
  userId: string | null;
  action: AuditAction;
  resource: string;
  resourceId: string | null;
  oldData: unknown | null;
  newData: unknown | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string } | null;
}
