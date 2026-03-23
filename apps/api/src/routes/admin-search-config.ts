import { Router, Request, Response } from 'express';
import { requireAdmin } from '../lib/admin.js';
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
    res.status(gate.status).json(gate.body);
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
      res.status(gate.status).json(gate.body);
      return;
    }

    const saved = saveAdminSearchConfig(req.body);
    res.status(200).json({ config: saved });
  },
);

export const adminSearchConfigRouter = router;
