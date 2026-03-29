import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

// Iter137 P1.9 — Marketplace enroll should import the course into the user's library
// as a user-owned course instance with a new id and backlink marketplaceCourseId.

describe('Iter137 P1.9: Marketplace enroll imports into library', () => {
  const app = createApp({ devMode: true });

  let token = '';

  beforeEach(async () => {
    // Clean slate: rely on admin cleanup route existing in devMode.
    // If it doesn't exist, the test still works by using a fresh user each run.

    // Register/login
    const email = `iter137-${Date.now()}@example.com`;
    const password = 'password123!';

    await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password, displayName: 'Iter137 Tester' });

    const login = await request(app).post('/api/v1/auth/login').send({ email, password });
    token = login.body?.accessToken;
    expect(token).toBeTruthy();

    // Upgrade to pro so we can publish paid course (not required if price=0, but keeps parity)
    await request(app)
      .post('/api/v1/subscription')
      .set('Authorization', `Bearer ${token}`)
      .send({ action: 'upgrade' });
  });

  it('enroll returns importedCourseId and course is visible in GET /courses', async () => {
    // Publish a marketplace course
    const pub = await request(app)
      .post('/api/v1/marketplace/publish')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Enroll Import Course',
        topic: 'enroll-import',
        description: 'Course used to test enroll → import into user library',
        difficulty: 'beginner',
        price: 0,
        lessonCount: 6,
        attributionCount: 3,
        readabilityScore: 0.75,
      });

    expect(pub.status).toBe(201);
    const marketplaceCourseId = pub.body?.course?.id;
    expect(marketplaceCourseId).toMatch(/^pub-/);

    // Checkout & confirm (mock)
    const start = await request(app)
      .post('/api/v1/marketplace/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId: marketplaceCourseId });
    expect(start.status).toBe(200);

    const confirm = await request(app)
      .post('/api/v1/marketplace/checkout/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ paymentIntentId: start.body.paymentIntent.id });

    expect(confirm.status).toBe(200);
    expect(confirm.body.enrolled).toBe(true);
    expect(confirm.body.importedCourseId).toBeTruthy();
    expect(confirm.body.importedCourseId).not.toBe(marketplaceCourseId);

    // Imported course should now show in the user's library list.
    const list = await request(app).get('/api/v1/courses').set('Authorization', `Bearer ${token}`);

    expect(list.status).toBe(200);
    const ids = (list.body?.courses || []).map((c: any) => c.id);
    expect(ids).toContain(confirm.body.importedCourseId);

    // And detail route should work.
    const detail = await request(app)
      .get(`/api/v1/courses/${confirm.body.importedCourseId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detail.status).toBe(200);
  });
});
