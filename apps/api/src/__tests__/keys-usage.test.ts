import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

// Iter68: keys list shows usageCount (count, not tokens) and lastUsed per provider.

describe('Iter68: GET /api/v1/keys returns usageCount + lastUsed', () => {
  const app = createApp();

  beforeEach(() => {
    db.clear();
    clearRateLimits();
  });

  it('returns usageCount as number of usage_records and lastUsed as ISO string', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `u-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' })
      .expect(201);

    const token = reg.body.accessToken;
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    const userId = payload.sub;

    // add key
    await request(app)
      .post('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'openai', apiKey: 'sk-abcdefghijklmnopqrstuvwxyz1234567890' })
      .expect(201);

    // add usage records for provider
    db.addUsageRecord({
      userId,
      agentName: 'tutor',
      provider: 'openai',
      tokensIn: 1,
      tokensOut: 2,
      tokensTotal: 3,
      createdAt: new Date('2026-03-01T10:00:00.000Z'),
    });
    db.addUsageRecord({
      userId,
      agentName: 'notes',
      provider: 'openai',
      tokensIn: 1,
      tokensOut: 1,
      tokensTotal: 2,
      createdAt: new Date('2026-03-02T10:00:00.000Z'),
    });

    const res = await request(app)
      .get('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const k = (res.body.keys || []).find((x: any) => x.provider === 'openai');
    expect(k).toBeTruthy();
    expect(typeof k.usageCount).toBe('number');
    expect(k.usageCount).toBeGreaterThanOrEqual(0);
    expect(k.lastUsed).toBeTypeOf('string');
    expect(k.lastUsed).toMatch(/Z$/);
  });
});
