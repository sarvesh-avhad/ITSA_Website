// ============================================================
// Registration Types
// ============================================================

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLISTED' | 'CANCELLED';

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  teamId: string | null;
  status: RegistrationStatus;
  qrCode: string | null;
  attendanceMarked: boolean;
  attendanceAt: string | null;
  formData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  user?: RegistrationUser;
  event?: RegistrationEvent;
  team?: RegistrationTeam | null;
}

export interface RegistrationUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  prn: string | null;
  branch: string | null;
  year: number | null;
  phone: string | null;
}

export interface RegistrationEvent {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  endDate: string;
  venue: string | null;
  posterUrl: string | null;
}

export interface RegistrationTeam {
  id: string;
  name: string;
  leader: RegistrationUser;
  members: RegistrationUser[];
}

export interface IndividualRegistrationRequest {
  eventId: string;
  formData?: Record<string, unknown>;
}

export interface TeamMemberRequest {
  name: string;
  email: string;
  phone: string;
  prn: string;
  branch: string;
  year: string;
}

export interface TeamRegistrationRequest {
  eventId: string;
  teamName: string;
  members: TeamMemberRequest[];
  formData?: Record<string, unknown>;
}

export interface UpdateRegistrationStatusRequest {
  status: RegistrationStatus;
}

// ============================================================
// Team Types
// ============================================================

export interface Team {
  id: string;
  name: string;
  eventId: string;
  leaderId: string;
  leader: RegistrationUser;
  members: TeamMember[];
  createdAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  user: RegistrationUser;
  createdAt: string;
}
