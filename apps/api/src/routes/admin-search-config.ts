import { Router, Request, Response } from 'express';
import { requireAdmin } from '../lib/admin.js';
import { sendError } from '../errors.js';
import {
  getAdminSearchConfig,
  saveAdminSearchConfig,
  adminSearchConfigSchema,
} from '../lib/search-config.js';
import { validateBody } from '../validation.js';

const router = Router();

// GET /api/v1/admin/search-config
router.get('/search-config', (req: Request, res: Response) => {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    sendError(res, req, {
      status: gate.status,
      code: gate.body?.error?.code || (gate.status === 401 ? 'unauthorized' : 'forbidden'),
      message: gate.body?.error?.message || 'Forbidden',
    });
    return;
  }
  const cfg = getAdminSearchConfig();
  res.status(200).json({ config: cfg });
});

// PUT /api/v1/admin/search-config
router.put(
  '/search-config',
  validateBody(adminSearchConfigSchema),
  (req: Request, res: Response) => {
    const gate = requireAdmin(req);
    if (!gate.ok) {
      sendError(res, req, {
        status: gate.status,
        code: gate.body?.error?.code || (gate.status === 401 ? 'unauthorized' : 'forbidden'),
        message: gate.body?.error?.message || 'Forbidden',
      });
      return;
    }

    const saved = saveAdminSearchConfig(req.body);
    res.status(200).json({ config: saved });
  },
);

export const adminSearchConfigRouter = router;
