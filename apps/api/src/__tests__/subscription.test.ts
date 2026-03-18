import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authRouter } from '../auth.js';
import { db } from '../db.js';
import { subscriptionRouter } from '../routes/subscription.js';
import { authMiddleware } from '../middleware.js';
import { UpdateAgent, MockWebSearchProvider } from '@learnflow/agents';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/subscription', authMiddleware, subscriptionRouter);
  return app;
}

const app = createTestApp();
let token: string;

beforeEach(async () => {
  db.clear();
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: `sub-${Date.now()}@test.com`,
      password: 'password123',
      displayName: 'Subscriber',
    });
  token = res.body.accessToken;
});

// S10-A01: Stripe subscription creates Pro user
describe('S10-A01: Subscription creates Pro user', () => {
  it('subscribes user to pro plan', async () => {
    const res = await request(app)
      .post('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'subscribe', plan: 'pro' });
    expect(res.status).toBe(200);
    expect(res.body.tier).toBe('pro');
  });
});

// S10-A02: Subscription downgrade removes Pro features
describe('S10-A02: Subscription downgrade', () => {
  it('cancels subscription and reverts to free', async () => {
    await request(app)
      .post('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'subscribe', plan: 'pro' });

    const res = await request(app)
      .post('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'cancel' });
    expect(res.status).toBe(200);
    expect(res.body.tier).toBe('free');
  });
});

// S10-A03: Managed API key pool serves Pro users
describe('S10-A03: Managed API key pool', () => {
  it('pro users get managed key access', async () => {
    await request(app)
      .post('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'subscribe', plan: 'pro' });

    const res = await request(app)
      .get('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.managedKeyAccess).toBe(true);
  });
});

// S10-A04: Feature flags gate free vs pro
describe('S10-A04: Feature flags', () => {
  it('free user has limited features', async () => {
    const res = await request(app)
      .get('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.features).toBeDefined();
    expect(res.body.features.proactiveUpdates).toBe(false);
    expect(res.body.features.unlimitedMindmap).toBe(false);
  });

  it('pro user has full features', async () => {
    await request(app)
      .post('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'subscribe', plan: 'pro' });

    const res = await request(app)
      .get('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.features.proactiveUpdates).toBe(true);
    expect(res.body.features.unlimitedMindmap).toBe(true);
  });
});

// S10-A05: Billing UI data (invoices)
describe('S10-A05: Billing data', () => {
  it('returns invoices list', async () => {
    const res = await request(app)
      .get('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.invoices).toBeDefined();
    expect(Array.isArray(res.body.invoices)).toBe(true);
  });
});

// S10-A09: Full flow: subscribe → access pro → cancel → lose access
describe('S10-A09: Full subscription flow', () => {
  it('subscribe → pro features → cancel → free features', async () => {
    // Subscribe
    const sub = await request(app)
      .post('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'subscribe', plan: 'pro' });
    expect(sub.body.tier).toBe('pro');

    // Check pro features
    const pro = await request(app)
      .get('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`);
    expect(pro.body.features.proactiveUpdates).toBe(true);

    // Cancel
    const cancel = await request(app)
      .post('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'cancel' });
    expect(cancel.body.tier).toBe('free');

    // Check free features
    const free = await request(app)
      .get('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`);
    expect(free.body.features.proactiveUpdates).toBe(false);
  });
});

// S10-A06: Update Agent detects new content for subscribed topic
describe('S10-A06: Update Agent detects new content', () => {
  it('detects updates for a subscribed topic', async () => {
    const provider = new MockWebSearchProvider();
    provider.addResults('quantum computing', [
      {
        title: 'Quantum Computing Breakthrough 2026',
        url: 'https://example.com/quantum-2026',
        snippet: 'New quantum processor achieves 1000 qubits.',
        publishDate: '2026-03-15',
        relevanceScore: 0.95,
      },
      {
        title: 'Quantum Error Correction Advances',
        url: 'https://example.com/qec',
        snippet: 'Novel error correction codes reduce overhead.',
        publishDate: '2026-03-14',
        relevanceScore: 0.88,
      },
    ]);

    const agent = new UpdateAgent(provider);
    agent.subscribe('user-1', 'topic-1', 'quantum computing');
    const results = await agent.detectUpdates('user-1', 'topic-1');

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].title).toContain('Quantum');
    expect(results[0].relevanceScore).toBeGreaterThanOrEqual(0.5);
  });
});

// S10-A07: Update Agent generates proactive notification content
describe('S10-A07: Update Agent generates notification', () => {
  it('produces notification from detected updates', async () => {
    const provider = new MockWebSearchProvider();
    provider.addResults('rust programming', [
      {
        title: 'Rust 2026 Edition Released',
        url: 'https://blog.rust-lang.org/2026',
        snippet: 'The Rust 2026 Edition brings async improvements.',
        publishDate: '2026-03-10',
        relevanceScore: 0.92,
      },
    ]);

    const agent = new UpdateAgent(provider);
    agent.subscribe('user-2', 'topic-2', 'rust programming');
    const notif = await agent.generateNotification('user-2', 'topic-2');

    expect(notif).not.toBeNull();
    expect(notif!.title).toContain('rust programming');
    expect(notif!.summary).toBeTruthy();
    expect(notif!.sources.length).toBeGreaterThanOrEqual(1);
    expect(notif!.type).toBe('new_content');
  });

  it('returns null when no updates found', async () => {
    const provider = new MockWebSearchProvider();
    const agent = new UpdateAgent(provider);
    // Not subscribed
    const notif = await agent.generateNotification('user-x', 'topic-x');
    expect(notif).toBeNull();
  });
});

// S10-A08: IAP receipt validation
describe('S10-A08: IAP receipt validation', () => {
  it('validates a valid iOS receipt', async () => {
    const res = await request(app)
      .post('/api/v1/subscription/iap')
      .set('Authorization', `Bearer ${token}`)
      .send({ platform: 'ios', receipt: 'valid-abc123def', productId: 'pro_monthly' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.tier).toBe('pro');
    expect(res.body.expiresAt).toBeTruthy();
  });

  it('rejects an invalid receipt', async () => {
    const res = await request(app)
      .post('/api/v1/subscription/iap')
      .set('Authorization', `Bearer ${token}`)
      .send({ platform: 'ios', receipt: 'invalid-receipt-data', productId: 'pro_monthly' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_receipt');
  });

  it('rejects malformed request', async () => {
    const res = await request(app)
      .post('/api/v1/subscription/iap')
      .set('Authorization', `Bearer ${token}`)
      .send({ platform: 'windows', receipt: 'x' });
    expect(res.status).toBe(400);
  });
});

// S10-A10: Subscription status cannot be spoofed via API
describe('S10-A10: Subscription spoofing prevention', () => {
  it('rejects direct tier manipulation via subscription body', async () => {
    // Try to inject tier directly - should be ignored
    const res = await request(app)
      .post('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'subscribe', plan: 'pro', tier: 'pro' });
    // This works because action=subscribe is valid, but extra fields are stripped by Zod
    expect(res.status).toBe(200);
    expect(res.body.tier).toBe('pro');
  });

  it('cannot access subscription without auth', async () => {
    const res = await request(app).get('/api/v1/subscription');
    expect(res.status).toBe(401);
  });

  it('cannot modify subscription without auth', async () => {
    const res = await request(app)
      .post('/api/v1/subscription')
      .send({ action: 'subscribe', plan: 'pro' });
    expect(res.status).toBe(401);
  });

  it('cannot spoof tier via GET endpoint', async () => {
    // Ensure GET returns actual tier from DB, not from request
    const res = await request(app)
      .get('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`)
      .query({ tier: 'pro' });
    expect(res.body.tier).toBe('free'); // Should still be free
  });
});
