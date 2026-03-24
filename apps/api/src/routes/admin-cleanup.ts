import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../validation.js';
import { sendError } from '../errors.js';
import { db } from '../db.js';

const router = Router();

/**
 * Iter86: Dev/admin cleanup endpoint to delete harness-origin data with guardrails + dry-run.
 *
 * Guardrails:
 * - Only available when devAuth is enabled (app.locals.devMode)
 * - Requires x-learnflow-origin !== 'user'
 * - Hard rejects origin='user'
 */

const cleanupSchema = z.object({
  origin: z.enum(['harness', 'screenshot', 'fixture', 'test']).default('harness'),
  dryRun: z.boolean().default(true),
  confirm: z.string().optional(),
});

router.post('/cleanup', validateBody(cleanupSchema), (req: Request, res: Response) => {
  const devMode = Boolean((req.app as any)?.locals?.devMode);
  if (!devMode) {
    sendError(res, req, {
      status: 403,
      code: 'forbidden',
      message: 'Dev admin endpoints disabled',
    });
    return;
  }

  const requestOrigin = String((req as any).origin || 'user');
  if (requestOrigin === 'user') {
    sendError(res, req, {
      status: 403,
      code: 'forbidden',
      message: 'Missing harness origin header',
    });
    return;
  }

  const { origin, dryRun, confirm } = req.body;
  if (origin === 'user') {
    sendError(res, req, {
      status: 400,
      code: 'validation_error',
      message: 'Refusing to clean up user data',
    });
    return;
  }

  if (!dryRun && confirm !== 'DELETE') {
    sendError(res, req, {
      status: 400,
      code: 'validation_error',
      message: 'Confirmation required. Provide confirm="DELETE" to proceed.',
    });
    return;
  }

  const result = db.adminCleanupByOrigin({ origin, dryRun });
  res.status(200).json({ ok: true, dryRun, origin, result });
});

export const adminCleanupRouter = router;
