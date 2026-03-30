import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

// Iter135 P1-7: usage transparency — ensure /usage/dashboard behaves deterministically.

describe('GET /api/v1/usage/dashboard', () => {
  const app = createApp();

  beforeEach(() => {
    db.clear();
    clearRateLimits();
  });

  it('returns stable structure + totals for a known range', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `u-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' })
      .expect(201);

    const token = reg.body.accessToken;
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    const userId = payload.sub;

    db.addUsageRecord({
      userId,
      agentName: 'tutor',
      provider: 'openai',
      tokensIn: 10,
      tokensOut: 20,
      tokensTotal: 30,
      origin: 'user',
      createdAt: new Date(),
    });
    db.addUsageRecord({
      userId,
      agentName: 'notes',
      provider: 'anthropic',
      tokensIn: 5,
      tokensOut: 5,
      tokensTotal: 10,
      origin: 'user',
      createdAt: new Date(),
    });

    const res = await request(app)
      .get('/api/v1/usage/dashboard?range=7')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.range).toBe(7);
    expect(res.body.totalTokens).toBeGreaterThanOrEqual(40);
    expect(Array.isArray(res.body.daily)).toBe(true);
    expect(Array.isArray(res.body.byAgent)).toBe(true);
    expect(Array.isArray(res.body.byProvider)).toBe(true);
  });
});
