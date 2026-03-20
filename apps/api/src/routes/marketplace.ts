import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

// In-memory marketplace data
interface MarketplaceCourse {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  price: number;
  rating: number;
  enrollmentCount: number;
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
    rating: 4.5,
    enrollmentCount: 1200,
  },
  {
    id: 'mc-2',
    title: 'Advanced Python',
    topic: 'python',
    difficulty: 'advanced',
    price: 19.99,
    rating: 4.8,
    enrollmentCount: 800,
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
router.get('/courses', (req: Request, res: Response) => {
  const parse = searchSchema.safeParse(req.query);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  let results = [...marketplaceCourses];
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

// POST /api/v1/marketplace/courses - Publish a course to marketplace
router.post('/courses', (req: Request, res: Response) => {
  const { title, description: _description, price, category, tags: _tags } = req.body || {};
  const newCourse: MarketplaceCourse = {
    id: `mc-${Date.now()}`,
    title: title || 'Untitled Course',
    topic: category || 'general',
    difficulty: 'intermediate',
    price: price || 0,
    rating: 0,
    enrollmentCount: 0,
  };
  marketplaceCourses.push(newCourse);
  res.status(201).json({ message: 'Course published', course: newCourse });
});

// GET /api/v1/marketplace/agents - Browse agent marketplace (public)
router.get('/agents', (_req: Request, res: Response) => {
  res.status(200).json({ agents: marketplaceAgents });
});

// NOTE: This router is mounted public. Agent activation + activated list live in the auth-protected
// marketplace-full router (and persist to DB via dbMarketplace).

export const marketplaceRouter = router;
