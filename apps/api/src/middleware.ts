import { Request, Response, NextFunction } from 'express';
import { sendError } from './errors.js';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { db } from './db.js';

/** Authenticated user attached to request */
export interface AuthUser {
  sub: string;
  email: string;
  role: 'student' | 'creator' | 'admin';
  tier: 'free' | 'pro';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** JWT auth middleware — verifies token and attaches typed user to req */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    sendError(res, req, {
      status: 401,
      code: 'unauthorized',
      message: 'Missing or invalid authorization header',
    });
    return;
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    sendError(res, req, {
      status: 401,
      code: 'unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

/** RBAC middleware — blocks users below required tier */
export function requireTier(requiredTier: 'pro' | 'admin') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, req, {
        status: 401,
        code: 'unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const tierHierarchy: Record<string, number> = { free: 0, pro: 1, admin: 2 };
    const userLevel = tierHierarchy[req.user.tier] ?? 0;
    const requiredLevel = tierHierarchy[requiredTier] ?? 0;

    if (userLevel < requiredLevel) {
      sendError(res, req, {
        status: 403,
        code: 'forbidden',
        message: `Requires ${requiredTier} tier`,
      });
      return;
    }

    next();
  };
}

/** Token usage tracking middleware — counts tokens per agent */
export function tokenUsageMiddleware(req: Request, res: Response, next: NextFunction): void {
  // After response, record token usage if present in response locals
  res.on('finish', () => {
    const agentId = res.getHeader('x-agent-id') as string | undefined;
    const tokensUsed = parseInt(res.getHeader('x-tokens-used') as string, 10);
    if (req.user && agentId && !isNaN(tokensUsed) && tokensUsed > 0) {
      db.addTokenUsage({
        userId: req.user.sub,
        agentId,
        tokensUsed,
        timestamp: new Date(),
      });
    }
  });
  next();
}
