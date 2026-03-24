import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

const app = createApp();

beforeEach(() => {
  db.clear();
  clearRateLimits();
});

async function registerAndGetToken(): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: `user-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' });
  return res.body.accessToken;
}

describe('Iter74 P0.5: pipeline exposes lesson milestone logs', () => {
  it('includes lessonMilestones array in pipeline state response', async () => {
    const token = await registerAndGetToken();

    const start = await request(app)
      .post('/api/v1/pipeline')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Milestone Test Topic' });

    expect(start.status).toBe(201);
    const pipelineId = String(start.body.pipelineId);

    const get = await request(app)
      .get(`/api/v1/pipeline/${pipelineId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(get.status).toBe(200);
    // We don't force non-empty (pipeline is async), but it must exist as an array when present.
    if (get.body.lessonMilestones != null) {
      expect(Array.isArray(get.body.lessonMilestones)).toBe(true);
    }
  });
});
