import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { isProduction } from '@/config/env';

/**
 * Global error handling middleware.
 * Catches all errors and returns consistent API error response envelope.
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  if (err instanceof AppError && err.isOperational) {
    logger.warn(
      {
        err: { message: err.message, code: err.code, statusCode: err.statusCode },
        requestId: req.requestId,
        method: req.method,
        path: req.path,
      },
      'Operational error'
    );
  } else {
    logger.error(
      {
        err,
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        body: req.body,
      },
      'Unexpected error'
    );
  }

  // Determine status and response
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details || undefined,
        requestId: req.requestId || 'unknown',
      },
    });
    return;
  }

  // Unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'An unexpected error occurred' : err.message,
      requestId: req.requestId || 'unknown',
    },
  });
};

/**
 * 404 handler for unmatched routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.requestId || 'unknown',
    },
  });
}
