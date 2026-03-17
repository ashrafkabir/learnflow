import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { db } from '../db.js';

const router = Router();

// ─── Feature Flags ───

interface FeatureFlags {
  proactiveUpdates: boolean;
  unlimitedMindmap: boolean;
  priorityAgents: boolean;
  managedApiKeys: boolean;
  advancedAnalytics: boolean;
}

function getFeatureFlags(tier: string): FeatureFlags {
  if (tier === 'pro') {
    return {
      proactiveUpdates: true,
      unlimitedMindmap: true,
      priorityAgents: true,
      managedApiKeys: true,
      advancedAnalytics: true,
    };
  }
  return {
    proactiveUpdates: false,
    unlimitedMindmap: false,
    priorityAgents: false,
    managedApiKeys: false,
    advancedAnalytics: false,
  };
}

// ─── In-memory subscription store ───

interface Invoice {
  id: string;
  amount: number;
  status: string;
  date: string;
}

const invoiceStore: Map<string, Invoice[]> = new Map();

const subscriptionSchema = z.object({
  action: z.enum(['subscribe', 'upgrade', 'downgrade', 'cancel']),
  plan: z.enum(['free', 'pro']).optional(),
});

// POST /api/v1/subscription — manage subscription
router.post('/', (req: Request, res: Response) => {
  const parse = subscriptionSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const { action, plan: _plan } = parse.data;
  const userId = req.user!.sub;
  const user = db.findUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'not_found', message: 'User not found', code: 404 });
    return;
  }

  if (action === 'subscribe' || action === 'upgrade') {
    user.tier = 'pro';
    // Record invoice
    if (!invoiceStore.has(userId)) invoiceStore.set(userId, []);
    invoiceStore.get(userId)!.push({
      id: `inv-${Date.now()}`,
      amount: 20.0,
      status: 'paid',
      date: new Date().toISOString(),
    });
  } else if (action === 'cancel' || action === 'downgrade') {
    user.tier = 'free';
  }

  res.status(200).json({
    message: `Subscription ${action} processed`,
    tier: user.tier,
    plan: user.tier,
    status: action === 'cancel' ? 'cancelled' : 'active',
    features: getFeatureFlags(user.tier),
  });
});

// GET /api/v1/subscription — get current subscription status
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const user = db.findUserById(userId);
  const tier = user?.tier || 'free';
  const features = getFeatureFlags(tier);
  const invoices = invoiceStore.get(userId) || [];

  res.status(200).json({
    tier,
    status: tier === 'pro' ? 'active' : 'inactive',
    managedKeyAccess: tier === 'pro',
    features,
    invoices,
  });
});

// ─── IAP Receipt Validation (S10-A08) ───

const iapReceiptSchema = z.object({
  platform: z.enum(['ios', 'android']),
  receipt: z.string().min(10),
  productId: z.string(),
});

interface IAPValidationResult {
  valid: boolean;
  productId: string;
  expiresAt: string | null;
}

/** Mock IAP receipt validator */
function validateIAPReceipt(
  platform: string,
  receipt: string,
  productId: string,
): IAPValidationResult {
  // Mock: receipts starting with 'valid-' are considered valid
  const isValid = receipt.startsWith('valid-');
  return {
    valid: isValid,
    productId,
    expiresAt: isValid ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
  };
}

// POST /api/v1/subscription/iap — validate IAP receipt
router.post('/iap', (req: Request, res: Response) => {
  const parse = iapReceiptSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const { platform, receipt, productId } = parse.data;
  const result = validateIAPReceipt(platform, receipt, productId);

  if (!result.valid) {
    res
      .status(400)
      .json({ error: 'invalid_receipt', message: 'IAP receipt validation failed', code: 400 });
    return;
  }

  // Activate subscription
  const userId = req.user!.sub;
  const user = db.findUserById(userId);
  if (user) {
    user.tier = 'pro';
  }

  res.status(200).json({
    valid: true,
    tier: 'pro',
    expiresAt: result.expiresAt,
    features: getFeatureFlags('pro'),
  });
});

export { getFeatureFlags };
export const subscriptionRouter = router;
