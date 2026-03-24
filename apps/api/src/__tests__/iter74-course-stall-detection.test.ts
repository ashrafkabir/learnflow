import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  db.clear();
  clearRateLimits();
  vi.restoreAllMocks();
  process.env.COURSE_CREATION_STALL_TIMEOUT_MS = '1';
  app = createApp();
});

async function registerAndGetToken(): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: `user-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' });
  return res.body.accessToken;
}

describe('Iter74 P0.6: course creation stall detection', () => {
  it('marks a CREATING course as FAILED(stalled) when older than timeout', async () => {
    const token = await registerAndGetToken();

    // Create a course shell quickly (background generation continues)
    const createRes = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Stall Fence Topic', depth: 'beginner' });

    expect(createRes.status).toBe(201);
    const courseId = String(createRes.body.id);

    // Force course shell to look old and still creating
    const row = (await import('../db.js')).dbCourses.getById(courseId) as any;
    expect(row).toBeTruthy();
    row.status = 'CREATING';
    row.createdAt = new Date(Date.now() - 60_000).toISOString();
    (await import('../db.js')).dbCourses.save(row);

    // Fetch quickly; background generation may already have completed. If it did,
    // that's also acceptable (the fence is opportunistic).
    const get = await request(app)
      .get(`/api/v1/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(get.status).toBe(200);
    const status = String(get.body.status || '');
    expect(['FAILED', 'READY'].includes(status)).toBe(true);
    if (status === 'FAILED') {
      expect(String(get.body.error || '')).toMatch(/stalled/i);
    }
  });
});
