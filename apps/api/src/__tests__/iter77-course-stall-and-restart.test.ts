import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { dbCourses } from '../db.js';
import { courses } from '../routes/courses.js';

// Disable external APIs in tests to use fast template fallback
delete process.env.OPENAI_API_KEY;
delete process.env.FIRECRAWL_API_KEY;

const app = createApp();

beforeEach(() => {
  db.clear();
  courses.clear();
  clearRateLimits();
  // short timeout so stall transition is deterministic
  process.env.COURSE_CREATION_STALL_TIMEOUT_MS = '1000';
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

describe('Iter77: stalled course transitions to FAILED(stalled) and can restart', () => {
  it('marks stalled course as FAILED with failureReason=stalled, then restart puts back to CREATING', async () => {
    const token = await registerAndGetToken();

    const createRes = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Stall Test', topic: 'Stall Topic', fast: true });

    expect(createRes.status).toBe(201);
    const courseId = String(createRes.body.id);

    // Force the course into a stalled state deterministically.
    const cur = dbCourses.getById(courseId) as any;
    expect(cur).toBeTruthy();
    dbCourses.save({
      ...cur,
      status: 'CREATING',
      lastProgressAt: new Date(Date.now() - 10_000).toISOString(),
    });
    courses.set(courseId, {
      ...(courses.get(courseId) as any),
      status: 'CREATING',
      lastProgressAt: new Date(Date.now() - 10_000).toISOString(),
    });

    const getRes = await request(app)
      .get(`/api/v1/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.status).toBe('FAILED');
    expect(getRes.body.failureReason).toBe('stalled');
    expect(String(getRes.body.failureMessage || getRes.body.error || '')).toMatch(/stalled/i);

    const restartRes = await request(app)
      .post(`/api/v1/courses/${courseId}/restart`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fast: true });

    expect(restartRes.status).toBe(200);
    expect(restartRes.body.status).toBe('CREATING');
    expect(typeof restartRes.body.generationAttempt).toBe('number');

    const after = await request(app)
      .get(`/api/v1/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(after.status).toBe(200);
    expect(['CREATING', 'READY', 'FAILED']).toContain(after.body.status);
    // It should have cleared failure metadata on restart.
    if (after.body.status === 'CREATING' || after.body.status === 'READY') {
      expect(after.body.failureReason || '').toBe('');
    }
  });
});
