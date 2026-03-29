import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

// Ensure tests are deterministic and never hit external APIs.
delete process.env.OPENAI_API_KEY;
delete process.env.FIRECRAWL_API_KEY;

describe('Daily lessons - quiz gaps', () => {
  beforeEach(() => {
    db.clear();
    courses.clear();
    clearRateLimits();
  });

  it('GET /api/v1/daily can emit reasonTag=quiz_gap when a recent quiz gap matches a lesson title', async () => {
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

    // Pick lesson1; ensure deterministic title match by using a gap tag included in title.
    const courseBody = (await request(app).get(`/api/v1/courses/${courseId}`).expect(200)).body;
    const lesson1 = courseBody.modules[0].lessons[0];

    await request(app)
      .post('/api/v1/events')
      .send({
        type: 'quiz.submitted',
        courseId,
        lessonId: lesson1.id,
        meta: { score: 55, gaps: [String(lesson1.title || '').split(' ')[0] || 'test'] },
      })
      .expect(201);

    const daily = await request(app).get('/api/v1/daily?limit=5').expect(200);
    const quizGap = daily.body.lessons.find((l: any) => l.reasonTag === 'quiz_gap');

    expect(quizGap).toBeTruthy();
    expect(quizGap.courseId).toBe(courseId);
    expect(quizGap.lessonId).toBe(lesson1.id);
    expect(String(quizGap.reason || '')).toMatch(/from last quiz/i);
  });

  it('GET /api/v1/daily does not recommend a completed lesson even if it matches a quiz gap', async () => {
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

    await request(app)
      .post('/api/v1/events')
      .send({
        type: 'quiz.submitted',
        courseId,
        lessonId: lesson1.id,
        meta: { score: 40, gaps: [String(lesson1.title || '').split(' ')[0] || 'test'] },
      })
      .expect(201);

    const daily = await request(app).get('/api/v1/daily?limit=5').expect(200);
    const hasCompleted = daily.body.lessons.some((l: any) => l.lessonId === lesson1.id);
    expect(hasCompleted).toBe(false);
  });
});
