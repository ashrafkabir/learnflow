/**
 * S09: Full Marketplace — course publishing, quality check, Stripe, creator dashboard, agent submission
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { sendError } from '../errors.js';
import { validateBody, validateQuery } from '../validation.js';
import {
  db,
  dbMarketplaceCourses,
  dbMarketplaceEnrollments,
  dbMarketplacePayouts,
  dbMarketplacePayments,
  dbMarketplaceAgentSubmissions,
  dbMarketplace,
} from '../db.js';
import { CAPABILITY_MATRIX } from '../lib/capabilities.js';

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
  status: 'created' | 'mock_completed' | 'completed' | 'failed';
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
export const activatedAgents: Map<string, Set<string>> = new Map(); // userId → agentIds (legacy, keep for tests)

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
  // Optional linkage to a real course in the user's library. When provided, QC fields are computed server-side.
  courseId: z.string().optional(),

  title: z.string().min(1),
  topic: z.string().min(1),
  description: z.string().min(10),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().min(0),

  // QC fields (legacy / client-provided). If courseId is present and the course is found, these are ignored.
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

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional().default(''),
});

// ─── Routes ───

// POST /api/v1/marketplace/publish — publish a course (S09-A01)
// POST /api/v1/marketplace/courses — publish a course (compat with client spec wording)
router.post(
  ['/publish', '/courses'],
  validateBody(publishCourseSchema),
  (req: Request, res: Response) => {
    const tierFromToken = String(req.user?.tier || 'free') as 'free' | 'pro' | string;
    const user = db.findUserById(req.user!.sub);
    const effectiveTier = (user?.tier || tierFromToken) as 'free' | 'pro' | string;

    const enabled =
      effectiveTier === 'pro' ? CAPABILITY_MATRIX.pro.enabled : CAPABILITY_MATRIX.free.enabled;
    if (!enabled['marketplace.publish']) {
      sendError(res, req, {
        status: 403,
        code: 'forbidden',
        message: 'Marketplace publishing is not enabled for your plan.',
      });
      return;
    }

    // Policy (Iter102): publishing is allowed for both Free and Pro, but paid publishing is Pro-only.
    const requestedPrice = Number((req.body as any)?.price || 0);
    if (requestedPrice > 0 && effectiveTier !== 'pro') {
      sendError(res, req, {
        status: 403,
        code: 'forbidden',
        message: 'Paid course publishing requires Pro. Set price to 0 or upgrade.',
        details: { tier: effectiveTier, price: requestedPrice },
      });
      return;
    }

    const data = req.body;

    // Map client payloads (`lessonCount`, `attributionCount`, `readabilityScore`) if present; otherwise rely on defaults.
    // Iter110 P1: Prefer server-computed QC values when the client provides a courseId.
    let lessonCount =
      typeof (req.body as any)?.lessonCount === 'number'
        ? (req.body as any).lessonCount
        : data.lessonCount;
    let attributionCount =
      typeof (req.body as any)?.attributionCount === 'number'
        ? (req.body as any).attributionCount
        : data.attributionCount;
    let readabilityScore =
      typeof (req.body as any)?.readabilityScore === 'number'
        ? (req.body as any).readabilityScore
        : data.readabilityScore;

    const requestedCourseId = String((req.body as any)?.courseId || '').trim();
    if (requestedCourseId) {
      const libCourse = dbCourses.getById(requestedCourseId);
      if (libCourse && String(libCourse.authorId || '') === String(req.user!.sub)) {
        // Lessons are currently stored inside the course.modules JSON.
        const lessons = (libCourse.modules || []).flatMap((m: any) => m.lessons || []);
        lessonCount = lessons.length || lessonCount;

        // Best-effort: count source attributions from structured lesson.sources (if present) and legacy inline citation markers.
        const uniqueSourceUrls = new Set<string>();
        for (const l of lessons) {
          const structured = (l as any)?.sources;
          if (Array.isArray(structured)) {
            for (const s of structured) {
              const url = String((s as any)?.url || '').trim();
              if (url) uniqueSourceUrls.add(url);
            }
          }
        }
        if (uniqueSourceUrls.size > 0) {
          attributionCount = uniqueSourceUrls.size;
        } else {
          const combined = lessons.map((l: any) => String(l.content || '')).join('\n');
          const citationMatches = combined.match(/\[\d+\]/g) || [];
          // QC wants a rough count of attributions; unique bracketed markers is a reasonable proxy.
          attributionCount = new Set(citationMatches).size;
        }

        // Best-effort readability: map pipeline heuristic (0..100) into the marketplace 0..1 scale.
        // This is not a true readability metric, but prevents spoofed extremes.
        const totalWords = lessons
          .map(
            (l: any) =>
              String(l.content || '')
                .split(/\s+/)
                .filter(Boolean).length,
          )
          .reduce((a: number, b: number) => a + b, 0);
        const objectivesAny = lessons.some((l: any) => /^- .+$/m.test(String(l.content || '')));
        const approx = Math.min(
          100,
          Math.max(40, 60 + (totalWords > 2500 ? 20 : 0) + (objectivesAny ? 10 : 0)),
        );
        readabilityScore = Math.max(0, Math.min(1, approx / 100));
      }
    }

    const qc = qualityCheck({ lessonCount, attributionCount, readabilityScore });

    const course: PublishedCourse = {
      id: `pub-${Date.now()}`,
      ...data,
      creatorId: req.user!.sub,
      lessonCount,
      attributionCount,
      readabilityScore,
      status: qc.passed ? 'published' : 'review',
      rating: 0,
      enrollmentCount: 0,
      revenue: 0,
      publishedAt: qc.passed ? new Date().toISOString() : null,
    };

    publishedCourses.set(course.id, course);

    // Persist published course
    dbMarketplaceCourses.upsert({
      id: course.id,
      title: course.title,
      topic: course.topic,
      description: course.description,
      difficulty: course.difficulty,
      price: course.price,
      creatorId: course.creatorId,
      status: course.status,
      lessonCount: course.lessonCount,
      attributionCount: course.attributionCount,
      readabilityScore: course.readabilityScore,
      rating: course.rating,
      enrollmentCount: course.enrollmentCount,
      revenue: course.revenue,
      publishedAt: course.publishedAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({ course, qualityCheck: qc });
  },
);

// GET /api/v1/marketplace/courses — search courses (public)
router.get('/courses', validateQuery(searchSchema), (req: Request, res: Response) => {
  let results: any[] = dbMarketplaceCourses.listPublished().map((c: any) => ({
    id: String(c.id),
    title: String(c.title),
    topic: String(c.topic),
    description: String(c.description),
    difficulty: String(c.difficulty),
    price: Number(c.price || 0),
    creatorId: String(c.creatorId),
    status: (String(c.status) as any) || 'published',
    lessonCount: Number(c.lessonCount || 0),
    attributionCount: Number(c.attributionCount || 0),
    readabilityScore: Number(c.readabilityScore || 0.7),
    rating: Number(c.rating || 0),
    enrollmentCount: Number(c.enrollmentCount || 0),
    revenue: Number(c.revenue || 0),
    publishedAt: c.publishedAt || null,
  })) as any;
  const { keyword, topic, difficulty, maxPrice } = req.query as any;

  if (keyword) {
    const kw = keyword.toLowerCase();
    results = results.filter(
      (c: any) => c.title.toLowerCase().includes(kw) || c.topic.toLowerCase().includes(kw),
    );
  }
  if (topic) results = results.filter((c: any) => c.topic === topic);
  if (difficulty) results = results.filter((c: any) => c.difficulty === difficulty);
  if (maxPrice !== undefined) results = results.filter((c: any) => c.price <= maxPrice);

  res.status(200).json({ courses: results });
});

// GET /api/v1/marketplace/courses/:id — course detail (client expects this)
router.get('/courses/:id', (req: Request, res: Response) => {
  const course = (publishedCourses.get(String(req.params.id)) ||
    (dbMarketplaceCourses.getById(String(req.params.id)) as any)) as any;
  if (!course || course.status !== 'published') {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Course not found' });
    return;
  }

  // Attach review aggregates + recent reviews
  try {
    const agg = dbMarketplace.getCourseReviewAgg(String(course.id));
    const reviews = dbMarketplace.listCourseReviews(String(course.id), 20).map((r) => ({
      author: String(r.userId),
      rating: Number(r.rating || 0),
      text: String(r.text || ''),
      date: String(r.createdAt).slice(0, 10),
    }));

    const rating = Number(agg.avgRating || 0);
    const reviewCount = Number(agg.count || 0);

    res.status(200).json({ course: { ...course, rating, reviewCount, reviews } });
    return;
  } catch {
    // Fall through to base course payload
  }

  res.status(200).json({ course });
});

// POST /api/v1/marketplace/courses/:id/reviews — create a review (Iter70)
router.post(
  '/courses/:id/reviews',
  validateBody(createReviewSchema),
  (req: Request, res: Response) => {
    const courseId = String(req.params.id);
    const course = (publishedCourses.get(courseId) ||
      (dbMarketplaceCourses.getById(courseId) as any)) as any;
    if (!course || course.status !== 'published') {
      sendError(res, req, { status: 404, code: 'not_found', message: 'Course not found' });
      return;
    }

    const review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      courseId,
      userId: req.user!.sub,
      rating: req.body.rating,
      text: String(req.body.text || ''),
      createdAt: new Date().toISOString(),
    };

    try {
      dbMarketplace.addCourseReview(review);
      const agg = dbMarketplace.getCourseReviewAgg(courseId);

      // Update course aggregate rating in course table for fast listing.
      const persisted = dbMarketplaceCourses.getById(courseId);
      if (persisted) {
        dbMarketplaceCourses.upsert({
          ...persisted,
          rating: Number(agg.avgRating || 0),
          updatedAt: new Date().toISOString(),
        } as any);
      }

      res
        .status(201)
        .json({ review, aggregates: { rating: agg.avgRating, reviewCount: agg.count } });
    } catch (err: any) {
      sendError(res, req, {
        status: 500,
        code: 'server_error',
        message: err?.message || 'Failed to save review',
      });
    }
  },
);

// POST /api/v1/marketplace/checkout — Stripe checkout (S09-A02)
// NOTE: MVP is in MOCK mode (no Stripe wiring). We still keep the state machine honest:
// - Return a non-terminal mock status.
// - Enrollment only occurs after explicit confirmation step.
const checkoutSchema = z.object({
  courseId: z.string().min(1),
});

router.post('/checkout', validateBody(checkoutSchema), (req: Request, res: Response) => {
  const { courseId } = req.body;
  const course = (publishedCourses.get(courseId) ||
    (dbMarketplaceCourses.getById(courseId) as any)) as any;
  if (!course) {
    sendError(res, req, { status: 404, code: 'not_found', message: 'Course not found' });
    return;
  }

  const intent: PaymentIntent = {
    id: `pi-${Date.now()}`,
    courseId,
    userId: req.user!.sub,
    amount: course.price,
    status: 'created',
    createdAt: new Date().toISOString(),
  };
  paymentIntents.set(intent.id, intent);

  dbMarketplacePayments.insertIntent({
    id: intent.id,
    userId: intent.userId,
    courseId: intent.courseId,
    amount: intent.amount,
    status: intent.status,
    createdAt: intent.createdAt,
  });

  res.status(200).json({ paymentIntent: intent, enrolled: false, billingMode: 'mock' });
});

// POST /api/v1/marketplace/checkout/confirm — confirm payment (MOCK)
const confirmCheckoutSchema = z.object({ paymentIntentId: z.string().min(1) });

router.post(
  '/checkout/confirm',
  validateBody(confirmCheckoutSchema),
  (req: Request, res: Response) => {
    const { paymentIntentId } = req.body;
    const intent = paymentIntents.get(paymentIntentId);
    if (!intent || intent.userId !== req.user!.sub) {
      sendError(res, req, { status: 404, code: 'not_found', message: 'Payment intent not found' });
      return;
    }

    const course = (publishedCourses.get(intent.courseId) ||
      (dbMarketplaceCourses.getById(intent.courseId) as any)) as any;
    if (!course) {
      sendError(res, req, { status: 404, code: 'not_found', message: 'Course not found' });
      return;
    }

    // Mock terminal state
    intent.status = 'mock_completed';
    paymentIntents.set(intent.id, intent);
    dbMarketplacePayments.updateStatus(intent.id, intent.status);

    // Process payout (S09-A03)
    const split = calculateRevenueSplit(course.price, 'byoai');
    const payout: PayoutRecord = {
      id: `po-${Date.now()}`,
      creatorId: course.creatorId,
      courseId: intent.courseId,
      amount: course.price,
      creatorShare: split.creatorShare,
      platformShare: split.platformShare,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    payoutRecords.set(payout.id, payout);

    // Enroll user
    if (!enrollments.has(req.user!.sub)) enrollments.set(req.user!.sub, new Set());
    enrollments.get(req.user!.sub)!.add(intent.courseId);
    course.enrollmentCount++;
    course.revenue += course.price;

    // Persist payout + enrollment
    dbMarketplacePayouts.insert({
      id: payout.id,
      creatorId: payout.creatorId,
      courseId: payout.courseId,
      amount: payout.amount,
      creatorShare: payout.creatorShare,
      platformShare: payout.platformShare,
      status: payout.status,
      createdAt: payout.createdAt,
    });
    dbMarketplaceEnrollments.enroll(req.user!.sub, intent.courseId);

    // Persist updated course aggregates
    dbMarketplaceCourses.upsert({
      id: course.id,
      title: course.title,
      topic: course.topic,
      description: course.description,
      difficulty: course.difficulty,
      price: course.price,
      creatorId: course.creatorId,
      status: course.status,
      lessonCount: course.lessonCount,
      attributionCount: course.attributionCount,
      readabilityScore: course.readabilityScore,
      rating: course.rating,
      enrollmentCount: course.enrollmentCount,
      revenue: course.revenue,
      publishedAt: course.publishedAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({ paymentIntent: intent, payout, enrolled: true, billingMode: 'mock' });
  },
);

// POST /api/v1/marketplace/agents/submit — submit agent (S09-A06)
router.post('/agents/submit', validateBody(submitAgentSchema), (req: Request, res: Response) => {
  const submission: AgentSubmission = {
    id: `as-${Date.now()}`,
    ...req.body,
    creatorId: req.user!.sub,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };
  agentSubmissions.set(submission.id, submission);

  // Persist submission
  dbMarketplaceAgentSubmissions.upsert({
    id: submission.id,
    name: submission.name,
    description: submission.description,
    manifest: submission.manifest,
    creatorId: submission.creatorId,
    status: submission.status,
    submittedAt: submission.submittedAt,
  });

  res.status(201).json({ submission });
});

// GET /api/v1/marketplace/agents — list agents (public)
router.get('/agents', (_req: Request, res: Response) => {
  const persisted = dbMarketplaceAgentSubmissions.listApproved();
  const inMem = Array.from(agentSubmissions.values()).filter((a) => a.status === 'approved');
  const agents = [...persisted, ...inMem].map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    manifest: (a as any).manifest,
    creatorId: (a as any).creatorId,
    status: (a as any).status,
    submittedAt: (a as any).submittedAt,
  }));
  res.status(200).json({ agents });
});

// GET /api/v1/marketplace/agents/activated — list activated agent IDs for current user (client expects this)
router.get('/agents/activated', async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  // Prefer persistent DB activation state.
  // Import via ESM dynamic import.
  const mod = await import('../db.js');
  const ids = mod.dbMarketplace.getActivatedAgents(userId);
  res.status(200).json({ activatedAgentIds: ids });
});

// POST /api/v1/marketplace/agents/:id/activate — activate agent (S09-A07)
router.post(
  '/agents/:id/activate',
  validateBody(z.object({})),
  async (req: Request, res: Response) => {
    const agentId = String(req.params.id);

    // Support both "full" submission ids (as-*) and seeded marketplace ids (ma-*).
    const agent = agentSubmissions.get(agentId) || ({ id: agentId, name: agentId } as any);

    // Persist activation.
    const mod = await import('../db.js');
    mod.dbMarketplace.activateAgent(req.user!.sub, agent.id);

    // Keep legacy in-memory map for existing marketplace-full tests.
    if (!activatedAgents.has(req.user!.sub)) activatedAgents.set(req.user!.sub, new Set());
    activatedAgents.get(req.user!.sub)!.add(agent.id);

    res.status(200).json({ message: `Agent "${agent.name}" activated`, agentId: agent.id });
  },
);

// GET /api/v1/marketplace/creator/dashboard — creator analytics (S09-A10)
router.get('/creator/dashboard', (req: Request, res: Response) => {
  const persisted = dbMarketplaceCourses.listByCreator(req.user!.sub).map((c) => ({
    id: String(c.id),
    title: String(c.title),
    topic: String(c.topic),
    description: String(c.description),
    difficulty: String(c.difficulty) as any,
    price: Number(c.price || 0),
    creatorId: String(c.creatorId),
    status: (String(c.status) as any) || 'published',
    lessonCount: Number(c.lessonCount || 0),
    attributionCount: Number(c.attributionCount || 0),
    readabilityScore: Number(c.readabilityScore || 0.7),
    rating: Number(c.rating || 0),
    enrollmentCount: Number(c.enrollmentCount || 0),
    revenue: Number(c.revenue || 0),
    publishedAt: c.publishedAt || null,
  }));

  const inMem = Array.from(publishedCourses.values()).filter((c) => c.creatorId === req.user!.sub);

  const mergedById = new Map<string, any>();
  for (const c of [...persisted, ...inMem]) mergedById.set(String(c.id), c);
  const creatorCourses = Array.from(mergedById.values());

  const creatorPayouts = [
    ...dbMarketplacePayouts.listByCreator(req.user!.sub),
    ...Array.from(payoutRecords.values()).filter((p) => p.creatorId === req.user!.sub),
  ];
  const totalEarnings = creatorPayouts.reduce((sum, p) => sum + (Number(p.creatorShare) || 0), 0);
  const totalEnrollments = creatorCourses.reduce(
    (sum, c) => sum + (Number(c.enrollmentCount) || 0),
    0,
  );

  res.status(200).json({
    courses: creatorCourses,
    totalEarnings,
    totalEnrollments,
    payouts: creatorPayouts,
  });
});

export const marketplaceFullRouter = router;
