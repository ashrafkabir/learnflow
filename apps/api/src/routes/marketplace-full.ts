/**
 * S09: Full Marketplace — course publishing, quality check, Stripe, creator dashboard, agent submission
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

// ─── Types ───

interface PublishedCourse {
  id: string;
  title: string;
  topic: string;
  description: string;
  difficulty: string;
  price: number;
  creatorId: string;
  status: 'draft' | 'review' | 'published' | 'rejected';
  lessonCount: number;
  attributionCount: number;
  readabilityScore: number;
  rating: number;
  enrollmentCount: number;
  revenue: number;
  publishedAt: string | null;
}

interface AgentSubmission {
  id: string;
  name: string;
  description: string;
  manifest: Record<string, unknown>;
  creatorId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

interface PaymentIntent {
  id: string;
  courseId: string;
  userId: string;
  amount: number;
  status: 'created' | 'completed' | 'failed';
  createdAt: string;
}

interface PayoutRecord {
  id: string;
  creatorId: string;
  courseId: string;
  amount: number;
  creatorShare: number;
  platformShare: number;
  status: 'pending' | 'paid';
  createdAt: string;
}

// ─── In-memory stores ───

export const publishedCourses: Map<string, PublishedCourse> = new Map();
export const agentSubmissions: Map<string, AgentSubmission> = new Map();
export const paymentIntents: Map<string, PaymentIntent> = new Map();
export const payoutRecords: Map<string, PayoutRecord> = new Map();
export const enrollments: Map<string, Set<string>> = new Map(); // userId → courseIds
export const activatedAgents: Map<string, Set<string>> = new Map(); // userId → agentIds

// ─── Quality Checker (S09-A08) ───

interface QualityCheckResult {
  passed: boolean;
  score: number;
  issues: string[];
}

export function qualityCheck(course: {
  lessonCount: number;
  attributionCount: number;
  readabilityScore: number;
}): QualityCheckResult {
  const issues: string[] = [];
  let score = 1.0;

  if (course.lessonCount < 5) {
    issues.push('Minimum 5 lessons required');
    score -= 0.3;
  }
  if (course.attributionCount < 3) {
    issues.push('Minimum 3 source attributions required');
    score -= 0.3;
  }
  if (course.readabilityScore < 0.5) {
    issues.push('Readability score too low (min 0.5)');
    score -= 0.2;
  }

  return { passed: issues.length === 0, score: Math.max(0, score), issues };
}

// ─── Revenue Split (S09-A09) ───

export function calculateRevenueSplit(
  amount: number,
  model: 'byoai' | 'pro',
): { creatorShare: number; platformShare: number } {
  const creatorPct = model === 'byoai' ? 0.85 : 0.8;
  return {
    creatorShare: Math.round(amount * creatorPct * 100) / 100,
    platformShare: Math.round(amount * (1 - creatorPct) * 100) / 100,
  };
}

// ─── Schemas ───

const publishCourseSchema = z.object({
  title: z.string().min(1),
  topic: z.string().min(1),
  description: z.string().min(10),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().min(0),
  lessonCount: z.number().min(1),
  attributionCount: z.number().min(0).default(0),
  readabilityScore: z.number().min(0).max(1).default(0.7),
});

const submitAgentSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(10),
  manifest: z.any(),
});

const searchSchema = z.object({
  keyword: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
});

// ─── Routes ───

// POST /api/v1/marketplace/publish — publish a course (S09-A01)
router.post('/publish', (req: Request, res: Response) => {
  const parse = publishCourseSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const data = parse.data;
  const qc = qualityCheck({
    lessonCount: data.lessonCount,
    attributionCount: data.attributionCount,
    readabilityScore: data.readabilityScore,
  });

  const course: PublishedCourse = {
    id: `pub-${Date.now()}`,
    ...data,
    creatorId: req.user!.sub,
    status: qc.passed ? 'published' : 'review',
    rating: 0,
    enrollmentCount: 0,
    revenue: 0,
    publishedAt: qc.passed ? new Date().toISOString() : null,
  };

  publishedCourses.set(course.id, course);

  res.status(201).json({ course, qualityCheck: qc });
});

// GET /api/v1/marketplace/courses — search courses (public)
router.get('/courses', (req: Request, res: Response) => {
  const parse = searchSchema.safeParse(req.query);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  let results = Array.from(publishedCourses.values()).filter((c) => c.status === 'published');
  const { keyword, topic, difficulty, maxPrice } = parse.data;

  if (keyword) {
    const kw = keyword.toLowerCase();
    results = results.filter(
      (c) => c.title.toLowerCase().includes(kw) || c.topic.toLowerCase().includes(kw),
    );
  }
  if (topic) results = results.filter((c) => c.topic === topic);
  if (difficulty) results = results.filter((c) => c.difficulty === difficulty);
  if (maxPrice !== undefined) results = results.filter((c) => c.price <= maxPrice);

  res.status(200).json({ courses: results });
});

// POST /api/v1/marketplace/checkout — Stripe checkout (S09-A02)
router.post('/checkout', (req: Request, res: Response) => {
  const { courseId } = req.body;
  const course = publishedCourses.get(courseId);
  if (!course) {
    res.status(404).json({ error: 'not_found', message: 'Course not found', code: 404 });
    return;
  }

  const intent: PaymentIntent = {
    id: `pi-${Date.now()}`,
    courseId,
    userId: req.user!.sub,
    amount: course.price,
    status: 'completed', // Mock: instant success
    createdAt: new Date().toISOString(),
  };
  paymentIntents.set(intent.id, intent);

  // Process payout (S09-A03)
  const split = calculateRevenueSplit(course.price, 'byoai');
  const payout: PayoutRecord = {
    id: `po-${Date.now()}`,
    creatorId: course.creatorId,
    courseId,
    amount: course.price,
    creatorShare: split.creatorShare,
    platformShare: split.platformShare,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  payoutRecords.set(payout.id, payout);

  // Enroll user
  if (!enrollments.has(req.user!.sub)) enrollments.set(req.user!.sub, new Set());
  enrollments.get(req.user!.sub)!.add(courseId);
  course.enrollmentCount++;
  course.revenue += course.price;

  res.status(200).json({ paymentIntent: intent, payout, enrolled: true });
});

// POST /api/v1/marketplace/agents/submit — submit agent (S09-A06)
router.post('/agents/submit', (req: Request, res: Response) => {
  const parse = submitAgentSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const submission: AgentSubmission = {
    id: `as-${Date.now()}`,
    ...parse.data,
    creatorId: req.user!.sub,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };
  agentSubmissions.set(submission.id, submission);

  res.status(201).json({ submission });
});

// GET /api/v1/marketplace/agents — list agents (public)
router.get('/agents', (_req: Request, res: Response) => {
  const agents = Array.from(agentSubmissions.values()).filter((a) => a.status === 'approved');
  res.status(200).json({ agents });
});

// POST /api/v1/marketplace/agents/:id/activate — activate agent (S09-A07)
router.post('/agents/:id/activate', (req: Request, res: Response) => {
  const agent = agentSubmissions.get(String(req.params.id));
  if (!agent) {
    res.status(404).json({ error: 'not_found', message: 'Agent not found', code: 404 });
    return;
  }

  if (!activatedAgents.has(req.user!.sub)) activatedAgents.set(req.user!.sub, new Set());
  activatedAgents.get(req.user!.sub)!.add(agent.id);

  res.status(200).json({ message: `Agent "${agent.name}" activated`, agentId: agent.id });
});

// GET /api/v1/marketplace/creator/dashboard — creator analytics (S09-A10)
router.get('/creator/dashboard', (req: Request, res: Response) => {
  const creatorCourses = Array.from(publishedCourses.values()).filter(
    (c) => c.creatorId === req.user!.sub,
  );
  const creatorPayouts = Array.from(payoutRecords.values()).filter(
    (p) => p.creatorId === req.user!.sub,
  );
  const totalEarnings = creatorPayouts.reduce((sum, p) => sum + p.creatorShare, 0);
  const totalEnrollments = creatorCourses.reduce((sum, c) => sum + c.enrollmentCount, 0);

  res.status(200).json({
    courses: creatorCourses,
    totalEarnings,
    totalEnrollments,
    payouts: creatorPayouts,
  });
});

export const marketplaceFullRouter = router;
