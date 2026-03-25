import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

// Iter94: collaboration matches must be explicitly labeled as synthetic suggestions.

describe('Iter94: collaboration matches truth labeling', () => {
  const app = createApp();

  beforeEach(() => {
    db.clear();
    clearRateLimits();
  });

  it('GET /collaboration/matches returns source=synthetic', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `m-${Date.now()}@test.com`,
        password: 'password123',
        displayName: 'Match User',
      })
      .expect(201);

    const token = reg.body.accessToken as string;

    // Seed user topics via profile/goals route
    await request(app)
      .post('/api/v1/profile/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ topics: ['Rust', 'TypeScript'] })
      .expect(200);

    const res = await request(app)
      .get('/api/v1/collaboration/matches')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.matches)).toBe(true);
    if (res.body.matches.length > 0) {
      expect(res.body.matches[0]).toHaveProperty('source');
      expect(res.body.matches[0].source).toBe('synthetic');
    }
  });
});
