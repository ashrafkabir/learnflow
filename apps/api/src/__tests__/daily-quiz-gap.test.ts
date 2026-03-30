import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db, dbCourses, dbMastery } from '../db.js';
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

  it('GET /api/v1/daily can emit reasonTag=quiz_gap when a recent quiz gap matches lesson conceptTags (even if title does not)', async () => {
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

    // Pick lesson1; force a conceptTag match that does NOT appear in the title.
    const courseBody = (await request(app).get(`/api/v1/courses/${courseId}`).expect(200)).body;
    const lesson1 = courseBody.modules[0].lessons[0];

    // Mutate the in-memory + persisted course to ensure the lesson has a conceptTag that isn't in its title.
    const forcedTag = 'spaced repetition';
    const forcedTagCanonical = 'spaced-repetition';

    for (const m of courseBody.modules) {
      for (const l of m.lessons) {
        if (l.id === lesson1.id) {
          l.conceptTags = [forcedTagCanonical];
          // Ensure title doesn't contain the tag.
          l.title = 'Intro lesson (unrelated title)';
        }
      }
    }

    // Persist + refresh so /daily sees our updated conceptTags/title.
    dbCourses.save(courseBody);
    courses.set(courseBody.id, courseBody);

    // Apply mastery update directly (events endpoint skips non-user origins and is best-effort).
    dbMastery.applyQuizSubmitted('test-user-1', courseId, lesson1.id, 55, [forcedTag]);

    const daily = await request(app).get('/api/v1/daily?limit=5').expect(200);
    const quizGap = daily.body.lessons.find((l: any) => l.reasonTag === 'quiz_gap');

    expect(quizGap).toBeTruthy();
    expect(quizGap.courseId).toBe(courseId);
    expect(quizGap.lessonId).toBe(lesson1.id);
    expect(String(quizGap.reason || '')).toMatch(/from last quiz/i);
    expect(String(quizGap.reason || '')).toMatch(/concept_tag|title_fallback/i);
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

    dbMastery.applyQuizSubmitted('test-user-1', courseId, lesson1.id, 40, [
      String(lesson1.title || '').split(' ')[0] || 'test',
    ]);

    const daily = await request(app).get('/api/v1/daily?limit=5').expect(200);
    const hasCompleted = daily.body.lessons.some((l: any) => l.lessonId === lesson1.id);
    expect(hasCompleted).toBe(false);
  });
});
