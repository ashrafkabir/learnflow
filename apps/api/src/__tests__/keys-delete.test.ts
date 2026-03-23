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

describe('Keys delete', () => {
  it('DELETE /api/v1/keys/:provider removes provider keys for the user', async () => {
    const token = await registerAndGetToken();

    const add = await request(app)
      .post('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'openai', apiKey: 'sk-testkey1234567890abcdefghijk' });
    expect(add.status).toBe(201);

    const list1 = await request(app).get('/api/v1/keys').set('Authorization', `Bearer ${token}`);
    expect(list1.status).toBe(200);
    expect(list1.body.keys.some((k: any) => k.provider === 'openai')).toBe(true);

    const del = await request(app)
      .delete('/api/v1/keys/openai')
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    const list2 = await request(app).get('/api/v1/keys').set('Authorization', `Bearer ${token}`);
    expect(list2.status).toBe(200);
    expect(list2.body.keys.some((k: any) => k.provider === 'openai')).toBe(false);
  });

  it('returns 404 when deleting a non-existent provider key', async () => {
    const token = await registerAndGetToken();

    const del = await request(app)
      .delete('/api/v1/keys/openai')
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(404);
    expect(del.body.error).toBe('not_found');
  });
});
