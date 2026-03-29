import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

// This test enforces that the server always labels matches as synthetic.
// It complements Iter94: collaboration matches truth labeling.

describe('Collaboration matches (synthetic source)', () => {
  const app = createApp();

  beforeEach(() => {
    db.clear();
    clearRateLimits();
  });

  it('returns source=synthetic for all matches', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `s-${Date.now()}@test.com`,
        password: 'password123',
        displayName: 'Synthetic User',
      })
      .expect(201);

    const token = reg.body.accessToken as string;

    await request(app)
      .post('/api/v1/profile/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ topics: ['Machine Learning', 'Web Development'] })
      .expect(200);

    const res = await request(app)
      .get('/api/v1/collaboration/matches')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.matches)).toBe(true);
    for (const m of res.body.matches) {
      expect(m.source).toBe('synthetic');
    }
  });
});
