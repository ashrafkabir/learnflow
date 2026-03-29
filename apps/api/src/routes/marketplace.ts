import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateQuery } from '../validation.js';

const router = Router();

// In-memory marketplace data
interface MarketplaceCourse {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  price: number;
  // MVP-safe: metrics are placeholders in this public in-memory router.
  // Do not treat as real analytics.
  rating?: number;
  enrollmentCount?: number;
  isDemo?: boolean;
}

interface MarketplaceAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  tier: string;
  active: boolean;
}

const marketplaceCourses: MarketplaceCourse[] = [
  {
    id: 'mc-1',
    title: 'Machine Learning Fundamentals',
    topic: 'machine-learning',
    difficulty: 'beginner',
    price: 0,
    isDemo: true,
  },
  {
    id: 'mc-2',
    title: 'Advanced Python',
    topic: 'python',
    difficulty: 'advanced',
    price: 19.99,
    isDemo: true,
  },
];

const marketplaceAgents: MarketplaceAgent[] = [
  {
    id: 'ma-1',
    name: 'Code Tutor',
    description: 'An agent that reviews and explains code',
    capabilities: ['code_review', 'explain_code'],
    tier: 'free',
    active: false,
  },
  {
    id: 'ma-2',
    name: 'Research Pro',
    description: 'Advanced research agent with paper access',
    capabilities: ['deep_research', 'paper_analysis'],
    tier: 'pro',
    active: false,
  },
];

// (activation is handled in marketplace-full router)

const searchSchema = z.object({
  keyword: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
});

// GET /api/v1/marketplace/courses - Browse course marketplace (public)
// Iter129: make the public router a thin proxy to the DB-backed listing to avoid split-brain.
router.get('/courses', validateQuery(searchSchema), async (req: Request, res: Response) => {
  const { keyword, topic, difficulty, maxPrice } = req.query as any;
  const qs = new URLSearchParams();
  if (keyword) qs.set('keyword', String(keyword));
  if (topic) qs.set('topic', String(topic));
  if (difficulty) qs.set('difficulty', String(difficulty));
  if (maxPrice !== undefined) qs.set('maxPrice', String(maxPrice));

  try {
    const mod = await import('../db.js');
    let results: any[] = mod.dbMarketplaceCourses.listPublished().map((c: any) => ({
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
    }));

    // Apply same filtering behavior as marketplace-full.
    if (keyword) {
      const kw = String(keyword).toLowerCase();
      results = results.filter(
        (c: any) => c.title.toLowerCase().includes(kw) || c.topic.toLowerCase().includes(kw),
      );
    }
    if (topic) results = results.filter((c: any) => c.topic === String(topic));
    if (difficulty) results = results.filter((c: any) => c.difficulty === String(difficulty));
    if (maxPrice !== undefined) results = results.filter((c: any) => c.price <= Number(maxPrice));

    res.status(200).json({ courses: results });
  } catch {
    // Fallback to demo in-memory data if DB access fails.
    let results = [...marketplaceCourses];
    if (keyword) {
      const kw = String(keyword).toLowerCase();
      results = results.filter(
        (c) => c.title.toLowerCase().includes(kw) || c.topic.toLowerCase().includes(kw),
      );
    }
    if (topic) results = results.filter((c) => c.topic === topic);
    if (difficulty) results = results.filter((c) => c.difficulty === difficulty);
    if (maxPrice !== undefined) results = results.filter((c) => c.price <= maxPrice);
    res.status(200).json({ courses: results });
  }
});

// POST /api/v1/marketplace/courses - Publish a course to marketplace
// Iter129: publishing stays auth-only in marketplace-full router.
router.post('/courses', (_req: Request, res: Response) => {
  res.status(405).json({
    message: 'Publishing is not available on the public marketplace endpoint. Please log in.',
  });
});

// GET /api/v1/marketplace/agents - Browse agent marketplace (public)
// Iter129: proxy to approved agent submissions when possible.
router.get('/agents', async (_req: Request, res: Response) => {
  try {
    const mod = await import('../db.js');
    const persisted = mod.dbMarketplaceAgentSubmissions.listApproved();
    const agents = persisted.map((a: any) => ({
      id: String(a.id),
      name: String(a.name),
      description: String(a.description),
      manifest: (a as any).manifest,
      creatorId: String((a as any).creatorId || ''),
      status: String((a as any).status || 'approved'),
      submittedAt: String((a as any).submittedAt || ''),
    }));
    res.status(200).json({ agents, activationMode: 'routing_only' });
  } catch {
    res.status(200).json({ agents: marketplaceAgents });
  }
});

// NOTE: This router is mounted public. Agent activation + activated list live in the auth-protected
// marketplace-full router (and persist to DB via dbMarketplace).

export const marketplaceRouter = router;
