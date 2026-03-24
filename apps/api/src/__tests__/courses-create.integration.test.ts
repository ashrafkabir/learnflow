import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

// Disable external APIs in tests to use fast template fallback
delete process.env.OPENAI_API_KEY;
delete process.env.FIRECRAWL_API_KEY;

const app = createApp();

beforeEach(() => {
  db.clear();
  courses.clear();
  clearRateLimits();
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

describe('POST /api/v1/courses integration', () => {
  it('returns quickly with status CREATING, then becomes READY with lessons populated', async () => {
    const token = await registerAndGetToken();

    const createRes = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Create Course Integration', topic: 'Testing' });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty('id');
    expect(createRes.body).toHaveProperty('status', 'CREATING');

    const id = String(createRes.body.id);

    const deadline = Date.now() + 60_000;
    let last: any = null;
    while (Date.now() < deadline) {
      const getRes = await request(app)
        .get(`/api/v1/courses/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(200);
      last = getRes.body;

      if (getRes.body?.status === 'READY') break;
      if (getRes.body?.status === 'FAILED') {
        throw new Error(`Course generation failed: ${getRes.body?.error || 'unknown'}`);
      }

      await new Promise((r) => setTimeout(r, 50));
    }

    expect(last).toBeTruthy();
    expect(last.status).toBe('READY');
    expect(Array.isArray(last.modules)).toBe(true);
    expect(last.modules.length).toBeGreaterThan(0);
    expect(Array.isArray(last.modules[0].lessons)).toBe(true);
    expect(last.modules[0].lessons.length).toBeGreaterThan(0);

    // Ensure generated lesson content exists
    expect(typeof last.modules[0].lessons[0].content).toBe('string');
    expect(last.modules[0].lessons[0].content.length).toBeGreaterThan(10);
  });
});
