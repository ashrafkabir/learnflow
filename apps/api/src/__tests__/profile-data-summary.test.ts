import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

// Iter82 P0: contract test for GET /api/v1/profile/data-summary

describe('Iter82: GET /api/v1/profile/data-summary', () => {
  const app = createApp();

  beforeEach(() => {
    db.clear();
    clearRateLimits();
  });

  it('returns 401 when unauthenticated', async () => {
    await request(app).get('/api/v1/profile/data-summary').expect(401);
  });

  it('returns expected shape with counts and timestamps', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `ds-${Date.now()}@test.com`,
        password: 'password123',
        displayName: 'Data Summary',
      })
      .expect(201);

    const token = reg.body.accessToken as string;

    // Seed a few rows for the user using existing public db helpers.
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    const userId = payload.sub as string;

    // usage_records
    db.addUsageRecord({
      userId,
      agentName: 'Tutor Agent',
      provider: 'openai',
      tokensIn: 1,
      tokensOut: 2,
      tokensTotal: 3,
      origin: 'user',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    // notifications
    db.addNotification({
      id: `notif-${Date.now()}`,
      userId,
      type: 'update',
      title: 'Hello',
      body: 'World',
      origin: 'user',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      readAt: null,
    });

    // learning events
    // Use events route to avoid reaching into internal exports.
    await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .set('x-learnflow-origin', 'user')
      .send({ type: 'lesson.started', meta: { a: 1 } })
      .expect(201);

    const res = await request(app)
      .get('/api/v1/profile/data-summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('learningEvents');
    expect(res.body).toHaveProperty('progress');
    expect(res.body).toHaveProperty('usageRecords');
    expect(res.body).toHaveProperty('notifications');
    expect(res.body).toHaveProperty('generatedAt');

    expect(res.body.learningEvents).toHaveProperty('count');
    expect(res.body.learningEvents).toHaveProperty('lastEventAt');

    expect(res.body.progress).toHaveProperty('completedCount');
    expect(res.body.progress).toHaveProperty('lastCompletedAt');

    expect(res.body.usageRecords).toHaveProperty('count');
    expect(res.body.usageRecords).toHaveProperty('lastUsedAt');

    expect(res.body.notifications).toHaveProperty('count');
    expect(res.body.notifications).toHaveProperty('lastNotificationAt');

    expect(typeof res.body.learningEvents.count).toBe('number');
    expect(typeof res.body.progress.completedCount).toBe('number');
    expect(typeof res.body.usageRecords.count).toBe('number');
    expect(typeof res.body.notifications.count).toBe('number');

    // Timestamps can be null when empty; for seeded items, should be non-empty strings.
    expect(res.body.learningEvents.lastEventAt).toBeTruthy();
    expect(res.body.usageRecords.lastUsedAt).toBeTruthy();
    expect(res.body.notifications.lastNotificationAt).toBeTruthy();
  });
});
