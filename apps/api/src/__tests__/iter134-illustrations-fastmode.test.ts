import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

// Iter134 P0: ensure fast mode yields at least 1 illustration so LessonReader hero never looks empty.

delete process.env.OPENAI_API_KEY;
delete process.env.FIRECRAWL_API_KEY;

const app = createApp();

beforeEach(() => {
  db.clear();
  courses.clear();
  clearRateLimits();
});

async function registerAndGetToken(): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: `user-${Date.now()}@test.com`,
      password: 'password123',
      displayName: 'Test',
    });
  return res.body.accessToken;
}

describe('Iter134: fast mode illustrations', () => {
  it('GET /courses/:id/lessons/:lessonId/illustrations returns >= 1 item for new fast course', async () => {
    const token = await registerAndGetToken();

    const createRes = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Iter134 ill fast', topic: 'Testing', fast: true });

    expect(createRes.status).toBe(201);
    const id = String(createRes.body.id);

    // Wait until READY
    const deadline = Date.now() + 60_000;
    let course: any = null;
    while (Date.now() < deadline) {
      const getRes = await request(app)
        .get(`/api/v1/courses/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.status).toBe(200);
      course = getRes.body;
      if (course?.status === 'READY') break;
      await new Promise((r) => setTimeout(r, 50));
    }

    expect(course?.status).toBe('READY');
    const lessonId = String(course.modules?.[0]?.lessons?.[0]?.id);
    expect(lessonId).toMatch(/-m0-l0/);

    const illRes = await request(app)
      .get(`/api/v1/courses/${id}/lessons/${lessonId}/illustrations`)
      .set('Authorization', `Bearer ${token}`);

    expect(illRes.status).toBe(200);
    expect(Array.isArray(illRes.body.illustrations)).toBe(true);
    expect(illRes.body.illustrations.length).toBeGreaterThanOrEqual(1);

    const first = illRes.body.illustrations[0];
    expect(first).toHaveProperty('imageUrl');
    expect(String(first.imageUrl)).toMatch(/^https?:\/\//);
    // Attribution metadata should be present best-effort.
    expect(first.provider).toBeTruthy();
  });
});
