import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware.js';

const router = Router();

// In-memory mindmaps
const mindmaps: Map<string, { userId: string; nodes: unknown[]; edges: unknown[] }> = new Map();

// GET /api/v1/mindmap - Get user's knowledge graph
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const mindmap = mindmaps.get(userId) || { userId, nodes: [], edges: [] };
  res.status(200).json(mindmap);
});

export const mindmapRouter = router;
