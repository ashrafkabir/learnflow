import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { db, dbInvoices } from '../db.js';
import { sendError } from '../errors.js';
import { validateBody } from '../validation.js';
import { CAPABILITY_MATRIX } from '../lib/capabilities.js';

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
  // MVP mapping: keep existing response shape, but derive it from the shared capability matrix.
  const enabled = tier === 'pro' ? CAPABILITY_MATRIX.pro.enabled : CAPABILITY_MATRIX.free.enabled;
  return {
    proactiveUpdates: Boolean(enabled.update_agent),
    unlimitedMindmap: Boolean(enabled['courses.unlimited']),
    priorityAgents: Boolean(enabled['agents.priority']),
    managedApiKeys: false,
    advancedAnalytics: Boolean(enabled['analytics.advanced']),
  };
}

// ─── In-memory subscription store ───

interface _Invoice {
  id: string;
  amount: number;
  status: string;
  date: string;
}

// Invoices stored in SQLite via dbInvoices

const subscriptionSchema = z.object({
  action: z.enum(['subscribe', 'upgrade', 'downgrade', 'cancel']),
  plan: z.enum(['free', 'pro']).optional(),
});

// POST /api/v1/subscription — manage subscription
router.post('/', validateBody(subscriptionSchema), (req: Request, res: Response) => {
  const { action, plan: _plan } = req.body;
  const userId = req.user!.sub;
  const user = db.findUserById(userId);
  if (!user) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'User not found' });
    return;
  }

  if (action === 'subscribe' || action === 'upgrade') {
    user.tier = 'pro';
    // Record invoice
    dbInvoices.add(userId, {
      id: `inv-${Date.now()}`,
      amount: 20.0,
      status: 'paid',
      date: new Date().toISOString(),
    });
  } else if (action === 'cancel' || action === 'downgrade') {
    user.tier = 'free';
  }

  user.updatedAt = new Date();
  db.updateUser(user);

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
  const invoices = dbInvoices.getByUser(userId);

  res.status(200).json({
    tier,
    status: tier === 'pro' ? 'active' : 'inactive',
    managedKeyAccess: Boolean(features.managedApiKeys),
    features,
    invoices,
  });
});

// GET /api/v1/subscription/status — alias for subscription status
router.get('/status', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const user = db.findUserById(userId);
  const tier = user?.tier || 'free';
  const features = getFeatureFlags(tier);

  res.status(200).json({
    tier,
    plan: tier,
    status: tier === 'pro' ? 'active' : 'inactive',
    managedKeyAccess: Boolean(features.managedApiKeys),
    features,
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
router.post('/iap', validateBody(iapReceiptSchema), (req: Request, res: Response) => {
  const { platform, receipt, productId } = req.body;
  const result = validateIAPReceipt(platform, receipt, productId);

  if (!result.valid) {
    sendError(res, req, {
      status: 400,
      code: 'invalid_receipt',
      message: 'IAP receipt validation failed',
    });
    return;
  }

  // Activate subscription
  const userId = req.user!.sub;
  const user = db.findUserById(userId);
  if (user) {
    user.tier = 'pro';
    user.updatedAt = new Date();
    db.updateUser(user);
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
