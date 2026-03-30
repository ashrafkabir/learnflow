import { Router, Request, Response } from 'express';
import { db, dbPipelines } from '../db.js';

const router = Router();

// Dev-only diagnostics. Must never reveal secrets.
// Guard: only available when app.locals.devMode is true.
router.get('/mode', (req: Request, res: Response) => {
  const devMode = Boolean((req.app as any)?.locals?.devMode);
  if (!devMode) {
    res.status(404).json({ error: 'not_found' });
    return;
  }

  const userId = req.user?.sub;

  // Billing is mock-only in this MVP.
  const billingMode: 'mock' | 'real' | 'unknown' = 'mock';

  // For sourceMode: best-effort from persisted pipelines (latest updatedAt).
  let sourceMode: 'real' | 'mock' | 'unknown' = 'unknown';
  try {
    const all = (dbPipelines as any)?.getAll?.() || [];
    const mine = (Array.isArray(all) ? all : []).filter(
      (p: any) => !p?.userId || p.userId === userId,
    );
    const sorted = [...mine].sort((a: any, b: any) => {
      const ta = Date.parse(a?.updatedAt || a?.createdAt || '') || 0;
      const tb = Date.parse(b?.updatedAt || b?.createdAt || '') || 0;
      return tb - ta;
    });
    const latest = sorted[0];
    const sm = latest?.sourceMode;
    if (sm === 'real' || sm === 'mock') sourceMode = sm;
  } catch {
    sourceMode = 'unknown';
  }

  // Research provider is constrained by spec to OpenAI web_search.
  const requiredResearchProvider = 'openai_web_search';

  // Active key presence: list active providers without revealing key material.
  const activeKeyProviders: string[] = (() => {
    try {
      if (!userId) return [];
      const keys = db.getKeysByUserId(userId) as any[];
      const providers = keys
        .filter((k) => k && k.active)
        .map((k) => String(k.provider || '').trim())
        .filter(Boolean);
      return Array.from(new Set(providers)).sort();
    } catch {
      return [];
    }
  })();

  res.status(200).json({ billingMode, sourceMode, requiredResearchProvider, activeKeyProviders });
});

export const diagnosticsRouter = router;
