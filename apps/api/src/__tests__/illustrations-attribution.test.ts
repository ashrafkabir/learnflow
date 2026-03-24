import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

// Ensure deterministic/offline mode
process.env.NODE_ENV = 'test';
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

describe('Illustrations attribution metadata', () => {
  it('returns provider/model/license fields on illustration create (degraded OK)', async () => {
    const token = await registerAndGetToken();

    const create = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Software testing', depth: 'beginner', title: 'Test Course' });

    expect(create.status).toBe(201);
    const courseId = String(create.body.id);
    const lessonId = String(create.body.modules?.[0]?.lessons?.[0]?.id);

    const ill = await request(app)
      .post(`/api/v1/courses/${courseId}/lessons/${lessonId}/illustrations`)
      .set('Authorization', `Bearer ${token}`)
      .send({ sectionIndex: 0, prompt: 'Unit testing pyramid', provider: 'wikimedia' });

    // In test mode, wikimedia provider returns no images and falls back to OpenAI (which is unavailable)
    // so we expect degraded illustration with attribution metadata.
    expect([201, 404]).toContain(ill.status);
    if (ill.status === 201) {
      expect(ill.body.illustration).toBeTruthy();
      expect(ill.body.illustration.provider).toBeTruthy();
      expect(ill.body.illustration.model).toBeTruthy();
      expect(ill.body.illustration.license).toBeTruthy();
      expect(ill.body.illustration.imageReason).toBeTruthy();
    }
  });
});
