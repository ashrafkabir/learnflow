import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../validation.js';
import { dbMarketplaceAgentSubmissions } from '../db.js';
import { resolveMarketplaceAgentManifest } from '../lib/marketplaceAgents.js';

const router = Router();

// POST /api/v1/marketplace/agents/manifests/resolve
// Given activated agent IDs, resolve minimal routing manifests.
router.post(
  '/agents/manifests/resolve',
  validateBody(z.object({ agentIds: z.array(z.string()).default([]) })),
  (req: Request, res: Response) => {
    const agentIds = Array.isArray(req.body?.agentIds) ? req.body.agentIds : [];
    const approved = dbMarketplaceAgentSubmissions.listApproved();
    const approvedById = new Map(approved.map((a) => [String(a.id), a]));

    const manifests = agentIds
      .map((id: string) => {
        const row = approvedById.get(String(id));
        return resolveMarketplaceAgentManifest({ agentId: String(id), manifest: row?.manifest });
      })
      .filter(Boolean);

    res.status(200).json({ manifests, activationMode: 'routing_only' });
  },
);

export const marketplaceAgentManifestsRouter = router;
