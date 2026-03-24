import type { Request, Response, NextFunction } from 'express';

export type ErrorEnvelope = {
  error: { code: string; message: string; details?: unknown };
  requestId: string;
  status?: number;
};

function isBodyParserEntityTooLargeError(err: any): boolean {
  return Boolean(
    err &&
    (err.type === 'entity.too.large' || err.status === 413) &&
    typeof err?.limit === 'number',
  );
}

export type AppErrorOptions = {
  status?: number;
  code: string;
  message: string;
  details?: unknown;
  cause?: unknown;
};

export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(opts: AppErrorOptions) {
    super(opts.message);
    this.name = 'AppError';
    this.status = opts.status ?? 400;
    this.code = opts.code;
    this.details = opts.details;
    // Node 16+ supports cause, but keep it best-effort.
    try {
      (this as any).cause = opts.cause;
    } catch {
      // ignore
    }
  }
}

export function createRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['x-request-id'];
  const inbound = Array.isArray(header) ? header[0] : header;
  const requestId = (inbound && String(inbound).trim()) || createRequestId();

  (req as any).requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

export function getRequestId(req: Request): string {
  const rid = (req as any).requestId;
  if (typeof rid === 'string' && rid.trim()) return rid;
  return createRequestId();
}

export function sendError(
  res: Response,
  req: Request,
  params: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  },
): void {
  const envelope: ErrorEnvelope = {
    error: {
      code: params.code,
      message: params.message,
      ...(params.details !== undefined ? { details: params.details } : {}),
    },
    requestId: getRequestId(req),
    status: params.status,
  };
  res.status(params.status).json(envelope);
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, req, {
    status: 404,
    code: 'not_found',
    message: `Route not found: ${req.method} ${req.path}`,
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (isBodyParserEntityTooLargeError(err)) {
    sendError(res, req, {
      status: 413,
      code: 'payload_too_large',
      message: 'Request payload too large',
      details: {
        limitBytes: (err as any).limit,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    sendError(res, req, {
      status: err.status,
      code: err.code,
      message: err.message,
      details: err.details,
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  sendError(res, req, { status: 500, code: 'internal_error', message });
}
