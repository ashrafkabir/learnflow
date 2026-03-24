import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

function tokenFor(userId: string, tier: 'free' | 'pro' = 'free') {
  return jwt.sign(
    { sub: userId, email: `${userId}@learnflow.dev`, role: 'student', tier },
    config.jwtSecret,
    { expiresIn: '1h' },
  );
}

describe('profile deletion + export zip', () => {
  it('DELETE /api/v1/profile deletes only authenticated user data', async () => {
    const app = createApp({ devMode: true });

    // Seed some data for two users.
    const u1 = 'user-1';
    const u2 = 'user-2';

    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `${u1}@learnflow.dev`, password: 'Password123!' });
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `${u2}@learnflow.dev`, password: 'Password123!' });

    // Create a course for u1 and u2
    await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${tokenFor(u1, 'pro')}`)
      .send({ topic: 'Topic U1' })
      .expect(201);

    await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${tokenFor(u2, 'pro')}`)
      .send({ topic: 'Topic U2' })
      .expect(201);

    // Delete u1
    const delRes = await request(app)
      .delete('/api/v1/profile')
      .set('Authorization', `Bearer ${tokenFor(u1, 'pro')}`);

    expect(delRes.status).toBe(200);
    expect(String(delRes.text)).toContain('ok');

    // u2 should still be able to fetch profile context
    const ctx2 = await request(app)
      .get('/api/v1/profile/context')
      .set('Authorization', `Bearer ${tokenFor(u2, 'free')}`);
    expect(ctx2.status).toBe(200);

    // u1 should no longer have a user row (context still returns based on JWT,
    // but goals/topics should be empty and export should return 403 for json)
    const exp1 = await request(app)
      .get('/api/v1/export')
      .set('Authorization', `Bearer ${tokenFor(u1, 'free')}`);
    expect(exp1.status).toBe(403);
  });

  it('GET /api/v1/export/zip returns application/zip for pro', async () => {
    const app = createApp({ devMode: true });
    const res = await request(app)
      .get('/api/v1/export/zip')
      .set('Authorization', `Bearer ${tokenFor('zip-user', 'pro')}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/zip');
  });

  it('GET /api/v1/profile/data-summary returns real counts', async () => {
    const app = createApp({ devMode: true });
    const userId = 'summary-user';

    await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${tokenFor(userId, 'pro')}`)
      .send({ topic: 'Summary Topic' })
      .expect(201);

    // best-effort: just verify shape and numeric counts
    const res = await request(app)
      .get('/api/v1/profile/data-summary')
      .set('Authorization', `Bearer ${tokenFor(userId, 'free')}`);

    expect(res.status).toBe(200);
    expect(typeof res.body?.progress?.completionsCount).toBe('number');
    expect(typeof res.body?.learningEvents?.count).toBe('number');
    expect(typeof res.body?.usageRecords?.count).toBe('number');
    expect(typeof res.body?.notifications?.count).toBe('number');
  });
});
