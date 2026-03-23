import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dbCollaboration } from '../db.js';
import { sendError } from '../errors.js';
import { validateBody } from '../validation.js';

export const collaborationRouter = Router();

// GET /api/v1/collaboration/matches
// MVP: return lightweight suggestions derived from the user profile topics (no ML matching yet).
collaborationRouter.get('/matches', (req: Request, res: Response) => {
  const topics = (req.user as any)?.topics || [];
  const normalized = Array.isArray(topics) ? topics : [];
  const matches = normalized.slice(0, 5).map((t: string, idx: number) => ({
    id: `match-${idx}`,
    displayName: `Study Partner ${idx + 1}`,
    topics: [String(t)],
    level: 'intermediate',
    online: idx % 2 === 0,
  }));
  res.status(200).json({ matches });
});

// POST /api/v1/collaboration/groups
const createGroupSchema = z.object({
  name: z.string().min(1).max(60),
  topic: z.string().min(0).max(120).optional(),
  memberIds: z.array(z.string().min(1)).optional(),
});

collaborationRouter.post(
  '/groups',
  validateBody(createGroupSchema),
  (req: Request, res: Response) => {
    const ownerId = req.user!.sub;
    const id = `cg-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const memberIds = Array.from(new Set([ownerId, ...(req.body.memberIds || [])].filter(Boolean)));

    dbCollaboration.createGroup({
      id,
      name: req.body.name,
      topic: req.body.topic || '',
      ownerId,
      memberIds,
      createdAt,
    });

    res.status(201).json({
      group: {
        id,
        name: req.body.name,
        topic: req.body.topic || '',
        ownerId,
        memberIds,
        createdAt,
      },
    });
  },
);

// GET /api/v1/collaboration/groups
collaborationRouter.get('/groups', (req: Request, res: Response) => {
  const groups = dbCollaboration.listGroupsForUser(req.user!.sub).map((g: any) => ({
    ...g,
    memberIds: (() => {
      try {
        return JSON.parse(g.memberIds || '[]');
      } catch {
        return [];
      }
    })(),
  }));
  res.status(200).json({ groups });
});

// POST /api/v1/collaboration/groups/:id/messages
const createGroupMessageSchema = z.object({ content: z.string().min(1).max(2000) });

collaborationRouter.post(
  '/groups/:id/messages',
  validateBody(createGroupMessageSchema),
  (req: Request, res: Response) => {
    const groupId = String(req.params.id);
    const group = dbCollaboration.getGroupById(groupId);
    if (!group) {
      sendError(res, req, { status: 404, code: 'not_found', message: 'Group not found' });
      return;
    }

    // basic authorization: must be a member
    let memberIds: string[] = [];
    try {
      memberIds = JSON.parse((group as any).memberIds || '[]');
    } catch {
      memberIds = [];
    }
    if (!memberIds.includes(req.user!.sub)) {
      sendError(res, req, { status: 403, code: 'forbidden', message: 'Not a group member' });
      return;
    }

    const id = `cgm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();
    dbCollaboration.addMessage({
      id,
      groupId,
      userId: req.user!.sub,
      content: req.body.content,
      createdAt,
    });

    res.status(201).json({
      message: { id, groupId, userId: req.user!.sub, content: req.body.content, createdAt },
    });
  },
);

// GET /api/v1/collaboration/groups/:id/messages
collaborationRouter.get('/groups/:id/messages', (req: Request, res: Response) => {
  const groupId = String(req.params.id);
  const group = dbCollaboration.getGroupById(groupId);
  if (!group) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Group not found' });
    return;
  }

  let memberIds: string[] = [];
  try {
    memberIds = JSON.parse((group as any).memberIds || '[]');
  } catch {
    memberIds = [];
  }
  if (!memberIds.includes(req.user!.sub)) {
    sendError(res, req, { status: 403, code: 'forbidden', message: 'Not a group member' });
    return;
  }

  const messages = dbCollaboration.listMessages(groupId);
  res.status(200).json({ messages });
});
