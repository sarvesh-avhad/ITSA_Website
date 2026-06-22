// ============================================================
// Custom Error Classes
// ============================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED', true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN', true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT', true);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation Error', details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', true, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message, 429, 'TOO_MANY_REQUESTS', true);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500, 'INTERNAL_ERROR', false);
  }
}
