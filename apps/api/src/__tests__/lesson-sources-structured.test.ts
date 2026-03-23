import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

// Ensure deterministic/offline mode
process.env.NODE_ENV = 'test';
delete process.env.OPENAI_API_KEY;
process.env.FIRECRAWL_API_KEY = '';

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

describe('Lesson structured sources', () => {
  it('includes a structured sources array on lesson responses (best-effort)', async () => {
    const token = await registerAndGetToken();

    const create = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Software testing', depth: 'beginner', title: 'Test Course' });

    expect(create.status).toBe(201);
    const courseId = String(create.body.id);
    const lessonId = String(create.body.modules?.[0]?.lessons?.[0]?.id);
    expect(courseId).toBeTruthy();
    expect(lessonId).toBeTruthy();

    const res = await request(app)
      .get(`/api/v1/courses/${courseId}/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sources)).toBe(true);
    // In test fast mode lesson content may not have a Sources section; still return an array.
    // Ensure shape when present.
    if (res.body.sources.length > 0) {
      expect(res.body.sources[0].title).toBeTruthy();
      expect(res.body.sources[0].url).toMatch(/^https?:\/\//);
    }
  });
});
