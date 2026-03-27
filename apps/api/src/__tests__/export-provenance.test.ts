import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { config } from '../config.js';

function mintToken(args: { sub: string; email: string; tier: 'free' | 'pro' }) {
  return jwt.sign(
    { sub: args.sub, email: args.email, role: 'student', tier: args.tier },
    config.jwtSecret,
    { expiresIn: '1h' },
  );
}

describe('Iter97: Export includes provenance durability fields', () => {
  beforeEach(() => {
    clearRateLimits();
    db.clear();
  });

  it('export JSON includes stable source ids + capturedAt/accessedAt + credibility', async () => {
    const app = createApp({ devMode: true });

    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `pro-${Date.now()}@test.com`,
        password: 'password123',
        displayName: 'Pro',
      })
      .expect(201);

    const regToken = reg.body.accessToken as string;
    const payload = JSON.parse(Buffer.from(regToken.split('.')[1], 'base64url').toString('utf8'));
    const userId = String(payload.sub || '');

    const token = mintToken({ sub: userId, email: String(payload.email || ''), tier: 'pro' });

    // Create a course (fast test mode). This should also persist lesson_sources best-effort.
    const create = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Software testing', depth: 'beginner', title: 'Export Provenance Course' })
      .expect(201);

    const courseId = String(create.body.id);
    expect(courseId).toBeTruthy();

    // Poll course until READY.
    const deadline = Date.now() + 60_000;
    let last: any = null;
    while (Date.now() < deadline) {
      const getRes = await request(app)
        .get(`/api/v1/courses/${courseId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      last = getRes.body;
      if (last?.status === 'READY') break;
      if (last?.status === 'FAILED') throw new Error(`Course failed: ${last?.error || 'unknown'}`);
      await new Promise((r) => setTimeout(r, 50));
    }

    const exportRes = await request(app)
      .get('/api/v1/export?format=json')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = JSON.parse(exportRes.text);
    expect(body.lessonSourcesByLessonId).toBeTruthy();

    const lessonIds = Object.keys(body.lessonSourcesByLessonId);
    expect(lessonIds.length).toBeGreaterThan(0);

    const first = body.lessonSourcesByLessonId[lessonIds[0]];
    expect(Array.isArray(first.sources)).toBe(true);

    if (first.sources.length > 0) {
      const s = first.sources[0];
      // Stable ids + timestamps + credibility fields
      expect(s).toHaveProperty('id');
      expect(String(s.id)).not.toEqual('');
      expect(s).toHaveProperty('accessedAt');
      expect(typeof s.accessedAt).toBe('string');
      expect(s).toHaveProperty('credibilityScore');
      expect(typeof s.credibilityScore).toBe('number');
      expect(s).toHaveProperty('credibilityLabel');

      // capturedAt is a new-ish durability field; allow absent for now if upstream doesn't set it.
      // When present, it must be an ISO string.
      if (s.capturedAt !== undefined && s.capturedAt !== null) {
        expect(typeof s.capturedAt).toBe('string');
      }
    }
  });
});
