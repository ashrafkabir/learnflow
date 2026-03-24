import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

const REQUIRED = [
  '## Learning Objectives',
  '## Estimated Time',
  '## Core Concepts',
  '## Worked Example',
  '## Recap',
  '## Quick Check',
  '## Sources',
  '## Next Steps',
];

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

describe('Iter72: lesson structure required headings', () => {
  it('course creation produces lessons containing required e-learning headings (test fast mode)', async () => {
    const token = await registerAndGetToken();
    const create = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Italian cooking basics' })
      .expect(201);

    const courseId = String(create.body.id);
    expect(courseId).toBeTruthy();

    const deadline = Date.now() + 60_000;
    let last: any = null;
    while (Date.now() < deadline) {
      const getRes = await request(app)
        .get(`/api/v1/courses/${courseId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(200);
      last = getRes.body;

      if (getRes.body?.status === 'READY') break;
      if (getRes.body?.status === 'FAILED') {
        throw new Error(`Course generation failed: ${getRes.body?.error || 'unknown'}`);
      }

      await new Promise((r) => setTimeout(r, 50));
    }

    const lessonId = last?.modules?.[0]?.lessons?.[0]?.id;
    expect(lessonId).toBeTruthy();

    const lesson = await request(app)
      .get(`/api/v1/courses/${courseId}/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const md = String(lesson.body.content || '');
    for (const h of REQUIRED) {
      expect(md).toContain(h);
    }

    // Quick check must include an answer key.
    expect(md.toLowerCase()).toContain('answer key');
  });
});
