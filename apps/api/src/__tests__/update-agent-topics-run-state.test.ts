import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

let token = '';

describe('GET /api/v1/update-agent/topics includes run state', () => {
  beforeEach(async () => {
    clearRateLimits();
    try {
      db.clear();
    } catch {
      // ignore
    }

    const app = createApp();
    const email = `ua-${Date.now()}@test.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password: 'password123', displayName: 'UA' });
    token = res.body.accessToken;
    // store for later
    (globalThis as any).__uaEmail = email;
  });

  it('returns lastRunAt/lastRunOk/lastRunError/lockedAt fields', async () => {
    const app = createApp();

    // Create topic via API so userId matches auth token.
    const tRes = await request(app)
      .post('/api/v1/update-agent/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'AI Safety', enabled: true })
      .expect(201);

    const topicId = tRes.body?.topic?.id;
    expect(topicId).toBeTruthy();

    // Seed run result directly.
    const email = String((globalThis as any).__uaEmail || '');
    const user = db.findUserByEmail(email);
    expect(user?.id).toBeTruthy();

    db.updateUpdateAgentTopicRunResult({
      userId: String(user!.id),
      topicId: String(topicId),
      lastRunAt: new Date('2026-01-02T00:00:00.000Z'),
      ok: false,
      error: 'HTTP 429',
    });

    const res = await request(app)
      .get('/api/v1/update-agent/topics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.topics)).toBe(true);

    const t = res.body.topics[0];
    expect(t).toMatchObject({
      id: String(topicId),
      topic: 'AI Safety',
      enabled: true,
      lastRunOk: false,
      lastRunError: 'HTTP 429',
    });
    expect(t).toHaveProperty('lastRunAt');
    expect(t).toHaveProperty('lockedAt');
  });
});
