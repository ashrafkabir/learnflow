import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

const app = createApp({ devMode: true });

beforeEach(() => {
  db.clear();
  courses.clear();
  clearRateLimits();
});

describe('Selection tools preview validation', () => {
  it('rejects unknown tool', async () => {
    const res = await request(app)
      .post('/api/v1/courses/course-x/lessons/lesson-y/selection-tools/preview')
      .send({ tool: 'nope', selectedText: 'hello world' });
    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('validation_error');
  });

  it('rejects oversized selectedText', async () => {
    const big = 'a'.repeat(5001);
    const res = await request(app)
      .post('/api/v1/courses/course-x/lessons/lesson-y/selection-tools/preview')
      .send({ tool: 'discover', selectedText: big });
    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('validation_error');
  });
});
