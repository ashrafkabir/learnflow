import { Router, Request, Response } from 'express';
import { dbMindmaps } from '../db.js';

const router = Router();

// GET /api/v1/mindmap - Get user's knowledge graph
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const mindmap = dbMindmaps.get(userId);
  res.status(200).json(mindmap);
});

export const mindmapRouter = router;
