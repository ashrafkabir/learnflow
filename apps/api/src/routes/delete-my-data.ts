import { Router, Request, Response } from 'express';
import { db } from '../db.js';

const router = Router();

// DELETE /api/v1/delete-my-data
// MVP: server-first deletion of all user-associated data.
router.delete('/', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  db.deleteUserData(userId);
  res.status(200).json({ ok: true });
});

export const deleteMyDataRouter = router;
