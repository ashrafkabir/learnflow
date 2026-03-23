import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dbMindmaps, dbMindmapSuggestions, dbCourses } from '../db.js';

const router = Router();

// GET /api/v1/mindmap - Get user's knowledge graph
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const mindmap = dbMindmaps.get(userId);
  res.status(200).json(mindmap);
});

const suggestSchema = z.object({
  courseId: z.string().min(1),
});

const acceptSchema = z.object({
  courseId: z.string().min(1),
  suggestionId: z.string().min(1),
});

// POST /api/v1/mindmap/suggest - Compute suggested expansion nodes for a course
router.post('/suggest', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const parse = suggestSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const { courseId } = parse.data;
  const course = dbCourses.getById(courseId);
  if (!course) {
    res.status(404).json({ error: 'not_found', message: 'Course not found', code: 404 });
    return;
  }

  // Heuristic suggestions (MVP): derive 3–6 “next topics” from existing module/lesson titles.
  // This is intentionally deterministic and non-LLM to keep tests stable.
  const titles = [course.title, ...(course.modules || []).map((m: any) => m.title)].join(' · ');
  const base = String(course.topic || course.title || '').trim();
  const candidates = [
    `${base}: best practices`,
    `${base}: common pitfalls`,
    `${base}: real-world examples`,
    `${base}: tooling & libraries`,
    `${base}: exercises`,
  ];

  const suggestions = candidates.slice(0, 5).map((label, idx) => ({
    id: `sug-${courseId}-${idx}`,
    label,
    reason: `Suggested next step based on your course: ${titles.slice(0, 120)}`,
  }));

  const saved = dbMindmapSuggestions.save(userId, courseId, suggestions);
  res.status(200).json(saved);
});

// GET /api/v1/mindmap/suggestions?courseId=... - Return persisted suggestions
router.get('/suggestions', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const courseId = String(req.query.courseId || '');
  if (!courseId) {
    res.status(400).json({ error: 'validation_error', message: 'courseId is required', code: 400 });
    return;
  }
  const row = dbMindmapSuggestions.get(userId, courseId);
  res.status(200).json(row || { userId, courseId, suggestions: [] });
});

// POST /api/v1/mindmap/accept - Accept a suggestion (remove from suggestions list)
router.post('/accept', (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const parse = acceptSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const { courseId, suggestionId } = parse.data;
  const row = dbMindmapSuggestions.get(userId, courseId);
  const current = Array.isArray(row?.suggestions) ? row!.suggestions : [];
  const next = current.filter((s: any) => String(s?.id) !== suggestionId);
  const saved = dbMindmapSuggestions.save(userId, courseId, next);
  res.status(200).json(saved);
});

export const mindmapRouter = router;
