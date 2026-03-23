import { Router, Request, Response } from 'express';
import { requireAdmin } from '../lib/admin.js';
import {
  getAdminSearchConfig,
  saveAdminSearchConfig,
  adminSearchConfigSchema,
} from '../lib/search-config.js';

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
router.put('/search-config', (req: Request, res: Response) => {
  const gate = requireAdmin(req);
  if (!gate.ok) {
    res.status(gate.status).json(gate.body);
    return;
  }

  const parse = adminSearchConfigSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const saved = saveAdminSearchConfig(parse.data);
  res.status(200).json({ config: saved });
});

export const adminSearchConfigRouter = router;
