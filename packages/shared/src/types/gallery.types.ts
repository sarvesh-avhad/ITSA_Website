// ============================================================
// Gallery Types
// ============================================================

export type MediaType = 'IMAGE' | 'VIDEO';

export interface GalleryAlbum {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  eventId: string | null;
  year: number;
  isPublished: boolean;
  sortOrder: number;
  mediaCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryAlbumDetail extends GalleryAlbum {
  media: GalleryMedia[];
  event?: { id: string; title: string; slug: string } | null;
}

export interface GalleryMedia {
  id: string;
  albumId: string;
  type: MediaType;
  url: string;
  thumbnailUrl: string | null;
  publicId: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface CreateAlbumRequest {
  title: string;
  description?: string;
  coverUrl?: string;
  eventId?: string;
  year: number;
  isPublished?: boolean;
}

export interface UpdateAlbumRequest extends Partial<CreateAlbumRequest> {
  sortOrder?: number;
}

export interface UploadMediaRequest {
  type: MediaType;
  caption?: string;
}

// ============================================================
// Sponsor Types
// ============================================================

export type SponsorTier = 'TITLE' | 'GOLD' | 'SILVER' | 'BRONZE' | 'ASSOCIATE';

export interface Sponsor {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  description: string | null;
  websiteUrl: string | null;
  tier: SponsorTier;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  clickCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSponsorRequest {
  name: string;
  logoUrl: string;
  description?: string;
  websiteUrl?: string;
  tier: SponsorTier;
  startDate?: string;
  endDate?: string;
  sortOrder?: number;
}

export interface UpdateSponsorRequest extends Partial<CreateSponsorRequest> {
  isActive?: boolean;
}
