import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

// Keep deterministic and offline.
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

describe('Iter74 P0.1: pipeline detail includes course plan (debug view)', () => {
  it('GET /api/v1/pipeline/:id includes debug.coursePlan after completion', async () => {
    const token = await registerAndGetToken();

    const start = await request(app)
      .post('/api/v1/pipeline')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Debug Plan Topic' });

    expect(start.status).toBe(201);
    const pipelineId = String(start.body.pipelineId);

    // Poll until reviewing
    let stage = '';
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      const get = await request(app)
        .get(`/api/v1/pipeline/${pipelineId}`)
        .set('Authorization', `Bearer ${token}`);

      if (get.status === 429) {
        await sleep(300);
        continue;
      }

      expect(get.status).toBe(200);
      stage = String(get.body.stage);
      if (stage === 'reviewing') break;
      if (stage === 'failed') throw new Error(`Pipeline failed: ${get.body.error || 'unknown'}`);
      await sleep(250);
    }

    expect(stage).toBe('reviewing');

    const done = await request(app)
      .get(`/api/v1/pipeline/${pipelineId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(done.status).toBe(200);
    expect(done.body.debug).toBeTruthy();
    expect(done.body.debug.coursePlan).toBeTruthy();
    expect(done.body.debug.coursePlan.version).toBe('iter74');
    expect(Array.isArray(done.body.debug.coursePlan.lessons)).toBe(true);
  }, 30_000);
});
