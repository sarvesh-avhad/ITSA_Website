// ============================================================
// Event Types
// ============================================================

export type EventStatus = 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type EventType = 'INDIVIDUAL' | 'TEAM';

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  rules: string | null;
  faqs: EventFaq[] | null;
  schedule: EventScheduleItem[] | null;
  bannerUrl: string | null;
  posterUrl: string | null;
  venue: string | null;
  startDate: string;
  endDate: string;
  registrationDeadline: string | null;
  maxParticipants: number | null;
  currentCount: number;
  eventType: EventType;
  status: EventStatus;
  isFeatured: boolean;
  isPublished: boolean;
  categoryId: string | null;
  category: EventCategory | null;
  maxTeamSize: number | null;
  minTeamSize: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventListItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  posterUrl: string | null;
  venue: string | null;
  startDate: string;
  endDate: string;
  status: EventStatus;
  eventType: EventType;
  currentCount: number;
  maxParticipants: number | null;
  category: EventCategory | null;
  isFeatured: boolean;
}

export interface EventFaq {
  question: string;
  answer: string;
}

export interface EventScheduleItem {
  time: string;
  title: string;
  description?: string;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  shortDescription?: string;
  rules?: string;
  faqs?: EventFaq[];
  schedule?: EventScheduleItem[];
  bannerUrl?: string;
  posterUrl?: string;
  venue?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  eventType: EventType;
  categoryId?: string;
  maxTeamSize?: number;
  minTeamSize?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: EventStatus;
}

export interface EventFilters {
  status?: EventStatus;
  categoryId?: string;
  eventType?: EventType;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}
