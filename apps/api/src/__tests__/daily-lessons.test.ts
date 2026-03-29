import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

// Ensure tests are deterministic and never hit external APIs.
delete process.env.OPENAI_API_KEY;
delete process.env.FIRECRAWL_API_KEY;

describe("Daily lessons (Today's Lessons)", () => {
  beforeEach(() => {
    db.clear();
    courses.clear();
    clearRateLimits();
  });

  it('GET /api/v1/daily never recommends a completed lesson', async () => {
    const app = createApp({ devMode: true });

    const created = await request(app)
      .post('/api/v1/courses')
      .send({ topic: 'Test Topic', depth: 'beginner', fast: true })
      .expect(201);

    const courseId = created.body?.id;

    // Wait for READY.
    const start = Date.now();
    while (Date.now() - start < 3000) {
      const r = await request(app).get(`/api/v1/courses/${courseId}`).expect(200);
      if (r.body?.status === 'READY') break;
      await new Promise((r2) => setTimeout(r2, 50));
    }

    const courseBody = (await request(app).get(`/api/v1/courses/${courseId}`).expect(200)).body;
    const lesson1 = courseBody.modules[0].lessons[0];

    await request(app)
      .post(`/api/v1/courses/${courseId}/lessons/${lesson1.id}/complete`)
      .send({})
      .expect(200);

    const daily = await request(app).get('/api/v1/daily?limit=5').expect(200);

    const hasCompleted = daily.body.lessons.some((l: any) => l.lessonId === lesson1.id);
    expect(hasCompleted).toBe(false);
  });
});
