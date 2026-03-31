import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { createApp } from '../app.js';

describe('Mindmap suggestions: dismiss endpoint', () => {
  it('POST /api/v1/mindmap/dismiss removes a suggestion id', async () => {
    process.env.LEARNFLOW_DEV_AUTH = '1';
    const app = createApp();

    // Create a real course
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `mindmap-dismiss-${Date.now()}@test.com`,
        password: 'password123',
        displayName: 'M',
      })
      .expect(201);

    const token = reg.body.accessToken;

    const createCourse = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Mindmap dismiss test', topic: 'Mindmap Dismiss' })
      .expect(201);

    const courseId = String(createCourse.body.id);

    const suggest = await request(app)
      .post('/api/v1/mindmap/suggest')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId })
      .expect(200);

    const suggestions = suggest.body?.suggestions || [];
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThan(0);

    const suggestionId = String(suggestions[0].id);

    const dismissed = await request(app)
      .post('/api/v1/mindmap/dismiss')
      .set('Authorization', `Bearer ${token}`)
      .send({ courseId, suggestionId })
      .expect(200);

    const next = dismissed.body?.suggestions || [];
    expect(next.some((s: any) => String(s?.id) === suggestionId)).toBe(false);
  });
});
