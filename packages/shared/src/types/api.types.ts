// ============================================================
// API Response Types
// ============================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationErrorDetail[];
    requestId: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ============================================================
// Health Check Types
// ============================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
}

export interface DeepHealthCheckResponse extends HealthCheckResponse {
  checks: {
    database: ServiceHealth;
    redis: ServiceHealth;
    cloudinary: ServiceHealth;
    s3: ServiceHealth;
    resend: ServiceHealth;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  latency?: string;
  error?: string;
}
