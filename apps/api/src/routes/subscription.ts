import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware.js';

const router = Router();

const subscriptionSchema = z.object({
  action: z.enum(['subscribe', 'upgrade', 'downgrade', 'cancel']),
  plan: z.enum(['free', 'pro']).optional(),
});

// POST /api/v1/subscription - Subscribe/upgrade/downgrade
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const parse = subscriptionSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const { action, plan } = parse.data;

  res.status(200).json({
    message: `Subscription ${action} processed`,
    plan: plan || 'free',
    status: action === 'cancel' ? 'cancelled' : 'active',
  });
});

export const subscriptionRouter = router;
