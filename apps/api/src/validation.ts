import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { z } from 'zod';
import { sendError } from './errors.js';

type AnyZodSchema = z.ZodTypeAny;

function formatZodError(err: z.ZodError): { message: string; details: unknown } {
  return {
    message: 'Validation error',
    details: err.flatten(),
  };
}

/**
 * validateBody(schema) sets req.body to the parsed output.
 * This is important for schemas using z.coerce / defaults / transforms.
 */
export function validateBody<T extends AnyZodSchema>(schema: T): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const f = formatZodError(parsed.error);
      sendError(res, req, {
        status: 400,
        code: 'validation_error',
        message: f.message,
        details: f.details,
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery<T extends AnyZodSchema>(schema: T): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const f = formatZodError(parsed.error);
      sendError(res, req, {
        status: 400,
        code: 'validation_error',
        message: f.message,
        details: f.details,
      });
      return;
    }
    req.query = parsed.data as any;
    next();
  };
}

export function validateParams<T extends AnyZodSchema>(schema: T): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      const f = formatZodError(parsed.error);
      sendError(res, req, {
        status: 400,
        code: 'validation_error',
        message: f.message,
        details: f.details,
      });
      return;
    }
    req.params = parsed.data as any;
    next();
  };
}

/**
 * validateQueryFrom(schema, selector) allows reshaping query params before validation.
 * Useful for endpoints that accept aliases like q|query.
 */
export function validateQueryFrom<T extends AnyZodSchema>(
  schema: T,
  selector: (req: Request) => unknown,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(selector(req));
    if (!parsed.success) {
      const f = formatZodError(parsed.error);
      sendError(res, req, {
        status: 400,
        code: 'validation_error',
        message: f.message,
        details: f.details,
      });
      return;
    }
    req.query = parsed.data as any;
    next();
  };
}
