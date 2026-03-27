import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  marketplaceFullRouter,
  publishedCourses,
  agentSubmissions,
  paymentIntents,
  payoutRecords,
  enrollments,
  activatedAgents,
  qualityCheck,
  calculateRevenueSplit,
} from '../routes/marketplace-full.js';
import { authRouter } from '../auth.js';
import { subscriptionRouter } from '../routes/subscription.js';
import { authMiddleware } from '../middleware.js';
import { db } from '../db.js';
import { errorHandler, requestIdMiddleware } from '../errors.js';

function createApp() {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(express.json());
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/subscription', authMiddleware, subscriptionRouter);
  // Public GET routes for search; auth required for everything else
  const publicPaths = ['/courses', '/agents'];
  // Express' req.path excludes the query string, so we only need to match the path prefix.
  const isPublicGet = (req: express.Request): boolean =>
    req.method === 'GET' && publicPaths.some((p) => req.path === p || req.path.startsWith(p + '/'));

  app.use(
    '/api/v1/marketplace',
    (req, res, next) => {
      if (isPublicGet(req)) return next();
      return authMiddleware(req, res, next);
    },
    marketplaceFullRouter,
  );
  app.use(errorHandler);
  return app;
}

const app = createApp();

let token: string;

async function upgradeToPro() {
  await request(app)
    .post('/api/v1/subscription')
    .set('Authorization', `Bearer ${token}`)
    .send({ action: 'upgrade' });
}

beforeEach(async () => {
  db.clear();
  publishedCourses.clear();
  agentSubmissions.clear();
  paymentIntents.clear();
  payoutRecords.clear();
  enrollments.clear();
  activatedAgents.clear();

  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: `mkt-${Date.now()}@test.com`, password: 'password123', displayName: 'Creator' });
  token = res.body.accessToken;
});

// S09-A01: Course publishing pipeline
describe('S09-A01: Course publishing', () => {
  it('create → quality check → publish (free can publish free; paid requires pro)', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/publish')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'ML Fundamentals',
        topic: 'machine-learning',
        description: 'A comprehensive course on machine learning fundamentals and applications',
        difficulty: 'beginner',
        price: 0,
        lessonCount: 10,
        attributionCount: 5,
        readabilityScore: 0.8,
      });
    expect(res.status).toBe(201);
    expect(res.body.course.status).toBe('published');
    expect(res.body.qualityCheck.passed).toBe(true);
  });

  it('rejects low quality course', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/publish')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Bad Course',
        topic: 'test',
        description: 'A course with insufficient content',
        difficulty: 'beginner',
        price: 0,
        lessonCount: 2,
        attributionCount: 0,
        readabilityScore: 0.3,
      });
    expect(res.status).toBe(201);
    expect(res.body.course.status).toBe('review');
    expect(res.body.qualityCheck.passed).toBe(false);
    expect(res.body.qualityCheck.issues.length).toBeGreaterThan(0);
  });
});

// S09-A02: Stripe checkout (MOCK) creates payment intent
describe('S09-A02: Stripe checkout (mock)', () => {
  it('creates payment intent for a published course (mock checkout)', async () => {
    // Publish a course
    const pub = await request(app)
      .post('/api/v1/marketplace/publish')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Paid Course',
        topic: 'test',
        description: 'A paid course for testing checkout',
        difficulty: 'beginner',
        price: 0,
        lessonCount: 8,
        attributionCount: 4,
        readabilityScore: 0.7,
      });
    const courseId = pub.body.course.id;

    const res = await request(app)
      .post('/api/v1/marketplace/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId });
    expect(res.status).toBe(200);
    expect(res.body.paymentIntent.amount).toBe(0);
    expect(res.body.paymentIntent.status).toBe('created');
    expect(res.body.enrolled).toBe(false);

    const confirm = await request(app)
      .post('/api/v1/marketplace/checkout/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ paymentIntentId: res.body.paymentIntent.id });
    expect(confirm.status).toBe(200);
    expect(confirm.body.paymentIntent.status).toBe('mock_completed');
    expect(confirm.body.enrolled).toBe(true);
  });
});

// S09-A03: Creator receives payout record
describe('S09-A03: Payout record', () => {
  it('creates payout after sale', async () => {
    await upgradeToPro();
    const pub = await request(app)
      .post('/api/v1/marketplace/publish')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Payout Test',
        topic: 'test',
        description: 'Course for testing payout distribution',
        difficulty: 'beginner',
        price: 50,
        lessonCount: 10,
        attributionCount: 5,
        readabilityScore: 0.8,
      });

    const start = await request(app)
      .post('/api/v1/marketplace/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: pub.body.course.id });

    await request(app)
      .post('/api/v1/marketplace/checkout/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ paymentIntentId: start.body.paymentIntent.id });

    expect(payoutRecords.size).toBe(1);
    const payout = Array.from(payoutRecords.values())[0];
    expect(payout.amount).toBe(50);
    expect(payout.creatorShare).toBeGreaterThan(0);
  });
});

// S09-A04: Course discovery — search by keyword
describe('S09-A04: Course search', () => {
  it('search by keyword returns relevant results', async () => {
    await request(app)
      .post('/api/v1/marketplace/publish')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Python Deep Dive',
        topic: 'python',
        description: 'Advanced Python programming course',
        difficulty: 'advanced',
        price: 0,
        lessonCount: 12,
        attributionCount: 6,
        readabilityScore: 0.85,
      });

    const res = await request(app).get('/api/v1/marketplace/courses?keyword=python');
    expect(res.status).toBe(200);
    expect(res.body.courses.length).toBe(1);
    expect(res.body.courses[0].title).toContain('Python');
  });
});

// S09-A05: Course discovery — filter by topic, difficulty, price
describe('S09-A05: Course filters', () => {
  it('filters by difficulty and max price', async () => {
    await upgradeToPro();
    await request(app)
      .post('/api/v1/marketplace/publish')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Beginner ML',
        topic: 'ml',
        description: 'Beginner machine learning course',
        difficulty: 'beginner',
        price: 10,
        lessonCount: 8,
        attributionCount: 4,
        readabilityScore: 0.7,
      });

    await request(app)
      .post('/api/v1/marketplace/publish')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Advanced ML',
        topic: 'ml',
        description: 'Advanced machine learning techniques',
        difficulty: 'advanced',
        price: 50,
        lessonCount: 15,
        attributionCount: 8,
        readabilityScore: 0.9,
      });

    const res = await request(app).get(
      '/api/v1/marketplace/courses?difficulty=beginner&maxPrice=20',
    );
    expect(res.status).toBe(200);
    expect(res.body.courses.length).toBe(1);
    expect(res.body.courses[0].difficulty).toBe('beginner');
  });
});

// S09-A06: Agent submission enters review queue
describe('S09-A06: Agent submission', () => {
  it('stores manifest and enters review queue', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/agents/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Custom Tutor',
        description: 'A custom tutoring agent with specialized knowledge',
        manifest: { capabilities: ['tutoring'], version: '1.0' },
      });
    expect(res.status).toBe(201);
    expect(res.body.submission.status).toBe('pending');
    expect(res.body.submission.name).toBe('Custom Tutor');
  });
});

// S09-A07: Agent activation adds agent to user's tools
describe('S09-A07: Agent activation', () => {
  it('activates approved agent', async () => {
    // Submit and manually approve
    const sub = await request(app)
      .post('/api/v1/marketplace/agents/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Approved Agent',
        description: 'An agent ready for activation',
        manifest: { capabilities: ['test'] },
      });
    const agentId = sub.body.submission.id;
    agentSubmissions.get(agentId)!.status = 'approved';

    const res = await request(app)
      .post(`/api/v1/marketplace/agents/${agentId}/activate`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(activatedAgents.size).toBe(1);
  });
});

// S09-A08: Quality checker enforces min lessons, attribution, readability
describe('S09-A08: Quality checker', () => {
  it('passes good course', () => {
    const result = qualityCheck({ lessonCount: 10, attributionCount: 5, readabilityScore: 0.8 });
    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('fails course with too few lessons', () => {
    const result = qualityCheck({ lessonCount: 3, attributionCount: 5, readabilityScore: 0.8 });
    expect(result.passed).toBe(false);
    expect(result.issues).toContain('Minimum 5 lessons required');
  });

  it('fails course with no attribution', () => {
    const result = qualityCheck({ lessonCount: 10, attributionCount: 1, readabilityScore: 0.8 });
    expect(result.passed).toBe(false);
  });
});

// S09-A09: Revenue split calculation
describe('S09-A09: Revenue split', () => {
  it('85/15 for BYOAI', () => {
    const split = calculateRevenueSplit(100, 'byoai');
    expect(split.creatorShare).toBe(85);
    expect(split.platformShare).toBe(15);
  });

  it('80/20 for Pro', () => {
    const split = calculateRevenueSplit(100, 'pro');
    expect(split.creatorShare).toBe(80);
    expect(split.platformShare).toBe(20);
  });
});

// S09-A10: Creator dashboard shows analytics
describe('S09-A10: Creator dashboard', () => {
  it('shows analytics and earnings', async () => {
    await upgradeToPro();
    // Publish and sell a course
    const pub = await request(app)
      .post('/api/v1/marketplace/publish')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Dashboard Test',
        topic: 'test',
        description: 'Course for testing creator dashboard',
        difficulty: 'beginner',
        price: 25,
        lessonCount: 8,
        attributionCount: 4,
        readabilityScore: 0.75,
      });

    const start = await request(app)
      .post('/api/v1/marketplace/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: pub.body.course.id });

    await request(app)
      .post('/api/v1/marketplace/checkout/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ paymentIntentId: start.body.paymentIntent.id });

    const res = await request(app)
      .get('/api/v1/marketplace/creator/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.courses.length).toBe(1);
    expect(res.body.totalEarnings).toBeGreaterThan(0);
    expect(res.body.totalEnrollments).toBe(1);
  });
});

// S09-A12: Full flow: create → publish → discover → enroll → access
describe('S09-A12: Full marketplace flow', () => {
  it('end-to-end marketplace journey', async () => {
    await upgradeToPro();
    // Create & publish
    const pub = await request(app)
      .post('/api/v1/marketplace/publish')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'E2E Course',
        topic: 'e2e',
        description: 'Full end-to-end marketplace testing course',
        difficulty: 'intermediate',
        price: 15,
        lessonCount: 10,
        attributionCount: 5,
        readabilityScore: 0.8,
      });
    expect(pub.body.course.status).toBe('published');
    const courseId = pub.body.course.id;

    // Discover
    const search = await request(app).get('/api/v1/marketplace/courses?keyword=e2e');
    expect(search.body.courses.length).toBe(1);

    // Enroll
    const checkout = await request(app)
      .post('/api/v1/marketplace/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId });
    expect(checkout.body.enrolled).toBe(false);

    const confirm = await request(app)
      .post('/api/v1/marketplace/checkout/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ paymentIntentId: checkout.body.paymentIntent.id });
    expect(confirm.body.enrolled).toBe(true);

    // Verify enrollment
    const userEnrollments = enrollments.get(confirm.body.paymentIntent.userId);
    expect(userEnrollments?.has(courseId)).toBe(true);
  });
});

// Iter102: Plan gating — Free can publish free courses; paid publishing requires Pro.
describe('Iter102: Publishing plan gating', () => {
  it('blocks free user from publishing a paid course', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/publish')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Paid Blocked',
        topic: 'test',
        description: 'This should be blocked for free tier when price > 0',
        difficulty: 'beginner',
        price: 9.99,
        lessonCount: 10,
        attributionCount: 5,
        readabilityScore: 0.8,
      });

    expect(res.status).toBe(403);
    expect(res.body?.error?.code || res.body?.error?.error?.code).toBeTruthy();
  });

  it('allows pro user to publish a paid course', async () => {
    // Upgrade to pro (mock subscription)
    await request(app)
      .post('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'upgrade' });

    const res = await request(app)
      .post('/api/v1/marketplace/publish')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Paid Allowed',
        topic: 'test',
        description: 'This should be allowed for pro tier when price > 0',
        difficulty: 'beginner',
        price: 9.99,
        lessonCount: 10,
        attributionCount: 5,
        readabilityScore: 0.8,
      });

    expect(res.status).toBe(201);
    expect(res.body.course.price).toBe(9.99);
  });
});
