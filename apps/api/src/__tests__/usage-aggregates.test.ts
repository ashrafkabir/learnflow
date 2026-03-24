import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

// Iter78 P0.2: stable /usage/aggregates (7/30 days)

describe('Iter78 P0.2: GET /api/v1/usage/aggregates', () => {
  const app = createApp();

  beforeEach(() => {
    db.clear();
    clearRateLimits();
  });

  it('returns 7/30 day aggregates with provider meta and top agents', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `u-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' })
      .expect(201);

    const token = reg.body.accessToken;
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    const userId = payload.sub;

    const now = Date.now();

    db.addUsageRecord({
      userId,
      agentName: 'course_builder',
      provider: 'openai',
      tokensIn: 10,
      tokensOut: 20,
      tokensTotal: 30,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    });

    db.addUsageRecord({
      userId,
      agentName: 'update_agent',
      provider: 'anthropic',
      tokensIn: 5,
      tokensOut: 5,
      tokensTotal: 10,
      createdAt: new Date(now - 15 * 24 * 60 * 60 * 1000),
    });

    const res = await request(app)
      .get('/api/v1/usage/aggregates')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.windows).toEqual([7, 30]);

    expect(res.body.data).toBeTruthy();
    expect(res.body.data['7']).toBeTruthy();
    expect(res.body.data['30']).toBeTruthy();

    // 7d should include only openai record
    expect(res.body.data['7'].totalTokens).toBeGreaterThanOrEqual(30);
    expect(res.body.data['7'].providerMeta?.some((p: any) => p.provider === 'openai')).toBe(true);
    expect(res.body.data['7'].providerMeta?.some((p: any) => p.provider === 'anthropic')).toBe(
      false,
    );

    // 30d should include both
    expect(res.body.data['30'].totalTokens).toBeGreaterThanOrEqual(40);
    expect(res.body.data['30'].providerMeta?.some((p: any) => p.provider === 'openai')).toBe(true);
    expect(res.body.data['30'].providerMeta?.some((p: any) => p.provider === 'anthropic')).toBe(
      true,
    );

    const openaiMeta = res.body.data['30'].providerMeta.find((p: any) => p.provider === 'openai');
    expect(openaiMeta.total).toBeGreaterThanOrEqual(30);
    expect(typeof openaiMeta.callCount).toBe('number');
    expect(openaiMeta.lastUsed === null || typeof openaiMeta.lastUsed === 'string').toBe(true);

    expect(Array.isArray(res.body.data['30'].topAgents)).toBe(true);
  });
});
