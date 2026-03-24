import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db, dbCourses, dbEvents } from '../db.js';

// Iter86: cleanup API deletes harness-origin data only, with guardrails.

describe('Iter86: POST /api/v1/admin/cleanup', () => {
  const app = createApp({ devMode: true });

  beforeEach(() => {
    db.clear();
    clearRateLimits();
  });

  it('dry-run returns counts and does not delete', async () => {
    // Seed harness artifacts
    const userId = 'u1';

    dbCourses.save({
      id: 'c-h1',
      title: 'Harness',
      description: '',
      topic: 'T',
      depth: 'standard',
      authorId: userId,
      modules: [],
      progress: {},
      status: 'READY',
      createdAt: new Date().toISOString(),
      origin: 'harness',
      generationAttempt: 0,
      generationStartedAt: null,
      lastProgressAt: null,
      failedAt: null,
      failureReason: null,
      failureMessage: null,
      error: null,
      plan: null,
    } as any);

    dbEvents.add(userId, { type: 'x', meta: {}, origin: 'harness' });

    const res = await request(app)
      .post('/api/v1/admin/cleanup')
      .set('x-learnflow-origin', 'harness')
      .send({ origin: 'harness', dryRun: true })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.dryRun).toBe(true);
    expect(res.body.result).toBeTruthy();
    expect(res.body.result.tables).toBeTruthy();

    // Ensure still present
    expect(dbCourses.getAll().some((c) => String((c as any).id) === 'c-h1')).toBe(true);
  });

  it('delete requires confirm and never allows origin=user', async () => {
    await request(app)
      .post('/api/v1/admin/cleanup')
      .set('x-learnflow-origin', 'harness')
      .send({ origin: 'user', dryRun: true })
      .expect(400);

    await request(app)
      .post('/api/v1/admin/cleanup')
      .set('x-learnflow-origin', 'harness')
      .send({ origin: 'harness', dryRun: false })
      .expect(400);

    await request(app)
      .post('/api/v1/admin/cleanup')
      .set('x-learnflow-origin', 'harness')
      .send({ origin: 'harness', dryRun: false, confirm: 'DELETE' })
      .expect(200);
  });

  it('refuses requests missing harness origin header', async () => {
    await request(app)
      .post('/api/v1/admin/cleanup')
      .send({ origin: 'harness', dryRun: true })
      .expect(403);
  });
});
