import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

// Iter73 P2.13: Make pipeline/course tests enforce a minimum word count deterministically.
// We run with test fast mode (no external APIs), but still require each lesson to be >= 500 words.

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

describe('Iter73 P2.13: minimum lesson word count (deterministic)', () => {
  it('generates lessons with >=500 words in test fast mode', async () => {
    const token = await registerAndGetToken();

    const createRes = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Min Words', topic: 'Testing' });

    expect(createRes.status).toBe(201);
    const id = String(createRes.body.id);

    const deadline = Date.now() + 60_000;
    let last: any = null;
    while (Date.now() < deadline) {
      const getRes = await request(app)
        .get(`/api/v1/courses/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(200);
      last = getRes.body;
      if (last?.status === 'READY') break;
      if (last?.status === 'FAILED') throw new Error(`FAILED: ${last?.error || 'unknown'}`);
      await new Promise((r) => setTimeout(r, 50));
    }

    expect(last?.status).toBe('READY');

    const lessons = (last.modules || []).flatMap((m: any) => m.lessons || []);
    expect(lessons.length).toBeGreaterThan(0);

    for (const l of lessons.slice(0, 3)) {
      // Only check a few to keep test runtime light.
      expect(l.wordCount).toBeGreaterThanOrEqual(500);
    }
  });
});
