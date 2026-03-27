import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

import { authRouter } from '../auth.js';
import { db } from '../db.js';
import { subscriptionRouter } from '../routes/subscription.js';
import { marketplaceFullRouter } from '../routes/marketplace-full.js';
import { authMiddleware } from '../middleware.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/subscription', authMiddleware, subscriptionRouter);
  app.use('/api/v1/marketplace/full', authMiddleware, marketplaceFullRouter);
  return app;
}

const app = createTestApp();
let token: string;

beforeEach(async () => {
  db.clear();
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: `bm-${Date.now()}@test.com`,
      password: 'password123',
      displayName: 'BillingMode',
    });
  token = res.body.accessToken;
});

describe('Billing mode boundary', () => {
  it('exposes billingMode=mock on subscription endpoints', async () => {
    const res = await request(app)
      .get('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.billingMode).toBe('mock');
  });

  it('exposes billingMode=mock on marketplace checkout endpoints', async () => {
    // Marketplace checkout is implemented in the "full" router as:
    // - POST /api/v1/marketplace/full/publish (or /courses) to publish a course
    // - POST /api/v1/marketplace/full/checkout with { courseId } to create a mock intent

    const publish = await request(app)
      .post('/api/v1/marketplace/full/publish')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Paid course',
        topic: 'Topic',
        description: 'A sufficiently long description for tests.',
        difficulty: 'beginner',
        price: 0,
        lessonCount: 5,
        attributionCount: 3,
        readabilityScore: 0.7,
      });
    expect(publish.status).toBe(201);

    const courseId = publish.body?.course?.id;
    expect(courseId).toBeTruthy();

    const checkout = await request(app)
      .post('/api/v1/marketplace/full/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId });

    expect(checkout.status).toBe(200);
    expect(checkout.body.billingMode).toBe('mock');
  });
});
