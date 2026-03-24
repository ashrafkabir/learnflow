import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

// NOTE: app must be created after env is set (pipeline module captures timeout at import time)
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  db.clear();
  clearRateLimits();
  vi.restoreAllMocks();
});

async function registerAndGetToken(): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: `user-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' });
  return res.body.accessToken;
}

describe('Pipeline hotfix (Iter73): stall auto-fail + restart', () => {
  it('marks a RUNNING pipeline as FAILED(stalled) when updatedAt is too old, and restart creates a new run id', async () => {
    process.env.PIPELINE_STALL_TIMEOUT_MS = '1';
    app = createApp();

    const token = await registerAndGetToken();

    // Start a pipeline
    const start = await request(app)
      .post('/api/v1/pipeline')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Stall Test Topic' });

    expect(start.status).toBe(201);
    const pipelineId = String(start.body.pipelineId);

    // Force the pipeline into a stalled RUNNING state in DB
    const existing = (await import('../db.js')).dbPipelines.getById(pipelineId) as any;
    expect(existing).toBeTruthy();

    existing.status = 'RUNNING';
    existing.stage = 'scraping';
    existing.progress = 10;
    existing.updatedAt = new Date(Date.now() - 60_000).toISOString();
    (await import('../db.js')).dbPipelines.save(existing);

    // GET should opportunistically fail it as stalled
    const get = await request(app)
      .get(`/api/v1/pipeline/${pipelineId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(get.status).toBe(200);
    expect(get.body.status).toBe('FAILED');
    expect(get.body.failReason).toBe('stalled');

    // Restart should create a new pipelineId and new courseId
    const restart = await request(app)
      .post(`/api/v1/pipeline/${pipelineId}/restart`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(restart.status).toBe(201);
    expect(restart.body.pipelineId).toBeTruthy();
    expect(restart.body.pipelineId).not.toBe(pipelineId);
    expect(String(restart.body.courseId)).toBe(`course-${restart.body.pipelineId}`);
  });
});
