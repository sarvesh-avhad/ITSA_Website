// ============================================================
// Auth Types
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  prn?: string;
  branch?: string;
  year?: number;
}

export interface GoogleAuthRequest {
  credential: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  phone?: string | null;
  prn?: string | null;
  branch?: string | null;
  year?: number | null;
  permissions: string[];
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ============================================================
// User Types
// ============================================================

export type UserRole = 'GUEST' | 'STUDENT' | 'ITSA_MEMBER' | 'EVENT_COORDINATOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  prn: string | null;
  branch: string | null;
  year: number | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  prn: string | null;
  branch: string | null;
  year: number | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  prn?: string;
  branch?: string;
  year?: number;
  avatarUrl?: string;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}
