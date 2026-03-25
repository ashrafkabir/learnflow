import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

// Iter94 P0: server-first delete-my-data should remove user rows.

describe('Iter94: DELETE /api/v1/delete-my-data', () => {
  it('deletes user + associated records', async () => {
    const app = createApp();
    clearRateLimits();
    db.clear();

    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `del-${Date.now()}@test.com`, password: 'password123', displayName: 'Del' })
      .expect(201);

    const token = reg.body.accessToken as string;

    // create at least one server-stored record for the user
    await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .set('x-learnflow-origin', 'user')
      .send({ type: 'lesson.started', meta: { a: 1 } })
      .expect(201);

    const before = await request(app)
      .get('/api/v1/profile/data-summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(before.body.learningEvents.count).toBeGreaterThan(0);

    await request(app)
      .delete('/api/v1/delete-my-data')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    const userId = payload.sub as string;

    // User row should be gone
    expect(db.findUserById(userId)).toBeUndefined();

    // Data summary should be empty
    const after = await request(app)
      .get('/api/v1/profile/data-summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(after.body.learningEvents.count).toBe(0);
    expect(after.body.usageRecords.count).toBe(0);
    expect(after.body.notifications.count).toBe(0);
  });
});
