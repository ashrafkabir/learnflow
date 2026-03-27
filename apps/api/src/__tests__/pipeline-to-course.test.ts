import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

// Disable external APIs in tests to use deterministic template fallback
// NOTE: The pipeline path uses OpenAI for query generation and web-search scraping by default.
// Force the heuristic generator and mock crawling mode so the test is stable/offline.
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe('Pipeline → course integration', () => {
  it('creates a course and reaches reviewing stage (mock mode) that is fetchable and owned by the user', async () => {
    const token = await registerAndGetToken();

    const start = await request(app)
      .post('/api/v1/pipeline')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Test Pipeline Topic' });

    expect(start.status).toBe(201);
    expect(start.body.pipelineId).toBeTruthy();
    expect(start.body.courseId).toBeTruthy();

    const pipelineId = String(start.body.pipelineId);
    const expectedCourseId = String(start.body.courseId);

    // With deterministic ids, the courseId should be derived from pipelineId.
    expect(expectedCourseId).toBe(`course-${pipelineId}`);

    // Poll until reviewing or failed
    let stage = '';
    let last: any = null;
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      const get = await request(app)
        .get(`/api/v1/pipeline/${pipelineId}`)
        .set('Authorization', `Bearer ${token}`);

      // Pipeline polling can trip the rate limiter on free tier.
      // Accept 429 and keep polling until the pipeline completes.
      if (get.status === 429) {
        await sleep(300);
        continue;
      }

      expect(get.status).toBe(200);
      last = get.body;
      stage = String(get.body.stage);
      if (stage === 'reviewing') break;
      if (stage === 'failed') {
        throw new Error(`Pipeline failed: ${get.body.error || 'unknown error'}`);
      }
      await sleep(250);
    }

    if (stage !== 'reviewing') {
      throw new Error(`Pipeline did not reach reviewing. Last stage: ${stage}`);
    }
    expect(last.courseId).toBe(expectedCourseId);

    const courseRes = await request(app)
      .get(`/api/v1/courses/${expectedCourseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(courseRes.status).toBe(200);
    // courses/:id returns the course object directly (not wrapped)
    expect(courseRes.body).toBeTruthy();
    expect(courseRes.body.id).toBe(expectedCourseId);
    expect(courseRes.body.modules?.length).toBeGreaterThan(0);
    // Ownership must be the authenticated user (not "pipeline")
    expect(courseRes.body.authorId).toBeTruthy();
    expect(courseRes.body.authorId).not.toBe('pipeline');
  }, 30_000);
});
