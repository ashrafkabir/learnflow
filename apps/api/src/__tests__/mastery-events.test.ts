import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

// Ensure tests are deterministic and never hit external APIs.
delete process.env.OPENAI_API_KEY;
delete process.env.FIRECRAWL_API_KEY;

describe('Mastery model (Iter138)', () => {
  beforeEach(() => {
    db.clear();
    courses.clear();
    clearRateLimits();
  });

  it('derives mastery from quiz.submitted and exposes it via API', async () => {
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
      .post('/api/v1/events')
      .send({
        type: 'quiz.submitted',
        courseId,
        lessonId: lesson1.id,
        meta: { score: 80, gaps: ['x', 'y'] },
      })
      .expect(201);

    const mastery = await request(app)
      .get(`/api/v1/courses/${courseId}/lessons/${lesson1.id}/mastery`)
      .expect(200);

    expect(mastery.body.courseId).toBe(courseId);
    expect(mastery.body.lessonId).toBe(lesson1.id);
    expect(mastery.body.mastery).toBeTruthy();
    expect(mastery.body.mastery.lastQuizScore).toBe(80);
    expect(mastery.body.mastery.gaps).toEqual(['x', 'y']);
    expect(typeof mastery.body.mastery.masteryLevel).toBe('number');
    expect(mastery.body.mastery.nextReviewAt).toBeTruthy();
  });
});
