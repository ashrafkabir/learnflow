import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware.js';

const router = Router();

const chatSchema = z.object({
  text: z.string().min(1),
  attachments: z.array(z.string()).optional(),
  context_overrides: z.record(z.unknown()).optional(),
});

// POST /api/v1/chat - Send message to Orchestrator
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const parse = chatSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const { text } = parse.data;

  // Simulated orchestrator response
  res.status(200).json({
    message_id: `msg-${Date.now()}`,
    response: `I received your message: "${text}". How can I help you learn today?`,
    actions: ['Create a Course', 'Quiz Me', 'Take Notes'],
    sources: [],
  });
});

export const chatRouter = router;
