import { Request, Response, NextFunction } from 'express';
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
    res.status(401).json({
      error: 'unauthorized',
      message: 'Missing or invalid authorization header',
      code: 401,
    });
    return;
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token', code: 401 });
  }
}

/** RBAC middleware — blocks users below required tier */
export function requireTier(requiredTier: 'pro' | 'admin') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'unauthorized', message: 'Not authenticated', code: 401 });
      return;
    }

    const tierHierarchy: Record<string, number> = { free: 0, pro: 1, admin: 2 };
    const userLevel = tierHierarchy[req.user.tier] ?? 0;
    const requiredLevel = tierHierarchy[requiredTier] ?? 0;

    if (userLevel < requiredLevel) {
      res
        .status(403)
        .json({ error: 'forbidden', message: `Requires ${requiredTier} tier`, code: 403 });
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
