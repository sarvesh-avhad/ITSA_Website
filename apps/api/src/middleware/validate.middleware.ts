import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/lib/errors';

/**
 * Validates request body, query, or params against a Zod schema.
 * Returns 422 with detailed validation errors on failure.
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      // Replace with parsed (and potentially transformed) data
      req[source] = data;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(new ValidationError('Validation failed', details));
      } else {
        next(err);
      }
    }
  };
}

/**
 * Validates query params (coercing types as needed).
 */
export function validateQuery(schema: ZodSchema) {
  return validate(schema, 'query');
}

/**
 * Validates URL path params.
 */
export function validateParams(schema: ZodSchema) {
  return validate(schema, 'params');
}
