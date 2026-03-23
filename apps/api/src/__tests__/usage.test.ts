import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

// S67-U01: usage_records persistence + /usage/summary

describe('S67-U01: GET /api/v1/usage/summary', () => {
  const app = createApp();

  beforeEach(() => {
    db.clear();
    clearRateLimits();
  });

  it('returns summary data including total tokens', async () => {
    // Create a user so protectedAuth passes.
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `u-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' })
      .expect(201);

    const token = reg.body.accessToken;

    // Insert deterministic usage record under this userId.
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    const userId = payload.sub;

    db.addUsageRecord({
      userId,
      agentName: 'course_builder',
      provider: 'openai',
      tokensIn: 10,
      tokensOut: 20,
      tokensTotal: 30,
      createdAt: new Date(),
    });

    const res = await request(app)
      .get('/api/v1/usage/summary?days=7')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.totalTokens).toBeGreaterThanOrEqual(30);
    expect(Array.isArray(res.body.byDay)).toBe(true);
    expect(Array.isArray(res.body.topAgents)).toBe(true);
    expect(Array.isArray(res.body.topProviders)).toBe(true);
  });
});
