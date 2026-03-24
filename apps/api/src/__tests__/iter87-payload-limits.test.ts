import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { config } from '../config.js';

// Iter87: ensure global body limits produce 413 + standard error envelope.

describe('Iter87 payload limits', () => {
  it('returns 413 with standard error envelope when payload too large', async () => {
    process.env.API_BODY_LIMIT = '1kb';
    const app = createApp({ devMode: true });

    const token = jwt.sign(
      { sub: 'u1', email: 'u@test.com', role: 'student', tier: 'free' },
      config.jwtSecret,
      { expiresIn: '1h' },
    );

    const big = 'x'.repeat(5_000);

    const res = await request(app)
      .post('/api/v1/profile/goals')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({ goals: [big], topics: [] });

    expect(res.status).toBe(413);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatchObject({
      code: 'payload_too_large',
      message: expect.any(String),
    });
    expect(res.body).toHaveProperty('requestId');
  });
});
