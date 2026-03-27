import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';
import { dbEvents } from '../db.js';

describe('Telemetry toggle suppresses learning events', () => {
  it('does not persist events when telemetryEnabled is false', async () => {
    const app = createApp();

    const email = `telemetry-${Date.now()}@example.com`;
    const password = 'Password123!';
    const displayName = 'Telemetry Test';

    await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password, displayName })
      .expect(201);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    const accessToken = loginRes.body?.accessToken;
    expect(typeof accessToken).toBe('string');

    const userId = loginRes.body?.user?.id;
    expect(typeof userId).toBe('string');

    // Disable telemetry
    await request(app)
      .post('/api/v1/profile/privacy')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ telemetryEnabled: false })
      .expect(200);

    const before = dbEvents.list(userId).length;

    // Attempt to record a lesson view event
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'lesson.view_start', courseId: 'c1', lessonId: 'l1', meta: {} })
      .expect(201);

    expect(res.body?.ok).toBe(true);
    expect(res.body?.skipped).toBe(true);
    expect(res.body?.reason).toBe('telemetry_disabled');

    const after = dbEvents.list(userId).length;
    expect(after).toBe(before);
  });
});
