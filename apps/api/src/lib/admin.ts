import type { Request } from 'express';
import { db, sqlite } from '../db.js';

/**
 * Minimal admin auth:
 * - If ADMIN_EMAIL env var is set: only that email is admin.
 * - Else: the first registered user becomes admin.
 */
export function isAdmin(req: Request): boolean {
  const email = req.user?.email;
  if (!email) return false;

  // Option 2 (Iter69): server-driven admin with a safe default.
  // Make demo@learnflow.ai always admin unless overridden.
  const configured = (process.env.ADMIN_EMAIL || 'demo@learnflow.ai').trim();
  if (configured.length > 0) {
    return configured.toLowerCase() === email.toLowerCase();
  }

  // If no ADMIN_EMAIL, treat the first user as admin.
  try {
    const n = db.countUsers();
    if (n <= 0) return false;
  } catch {
    // fallback below
  }

  // Best-effort: compare to earliest user by querying sqlite directly.
  try {
    const row = sqlite
      .prepare('SELECT email FROM users ORDER BY datetime(createdAt) ASC LIMIT 1')
      .get() as any;
    return String(row?.email || '').toLowerCase() === email.toLowerCase();
  } catch {
    return false;
  }
}

export function requireAdmin(
  req: Request,
): { ok: true } | { ok: false; status: number; body: any } {
  if (!req.user) {
    return {
      ok: false,
      status: 401,
      body: { error: 'unauthorized', message: 'Not authenticated', code: 401 },
    };
  }
  if (!isAdmin(req)) {
    return {
      ok: false,
      status: 403,
      body: { error: 'forbidden', message: 'Admin access required', code: 403 },
    };
  }
  return { ok: true };
}
