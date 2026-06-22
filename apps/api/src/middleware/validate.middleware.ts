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
      // For req.body we can reassign, but req.query and req.params might have only getters
      if (source === 'body') {
        req.body = data;
      } else {
        // Just merge the validated data back into the object instead of replacing it
        Object.assign(req[source], data);
      }
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
