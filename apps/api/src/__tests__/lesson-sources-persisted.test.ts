import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

const app = createApp();

beforeEach(() => {
  db.clear();
  courses.clear();
  clearRateLimits();
});

async function registerAndGetToken(): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: `user-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' });
  return res.body.accessToken;
}

describe('S67-SRC-01: lesson sources persisted', () => {
  it('stores sources in lesson_sources table', async () => {
    const token = await registerAndGetToken();

    const create = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Software testing', depth: 'beginner', title: 'Test Course' });

    expect(create.status).toBe(201);
    const courseId = String(create.body.id);
    const lessonId = String(create.body.modules?.[0]?.lessons?.[0]?.id);

    const res = await request(app)
      .get(`/api/v1/courses/${courseId}/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const persisted = (db as any).__getLessonSources(lessonId);
    expect(Array.isArray(persisted?.sources)).toBe(true);
  });
});
