import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db.js';

const app = createApp();

beforeEach(() => {
  db.clear();
  delete process.env.ADMIN_EMAIL;
});

async function register(email: string) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: 'Password123!', displayName: 'User' });
  return res.body.accessToken as string;
}

describe('Iter68: /api/v1/admin/search-config', () => {
  it('blocks non-admin user with standard envelope', async () => {
    // register two users; second is not admin when ADMIN_EMAIL unset
    await register(`a-${Date.now()}@test.com`);
    const t2 = await register(`b-${Date.now()}@test.com`);

    const res = await request(app)
      .get('/api/v1/admin/search-config')
      .set('Authorization', `Bearer ${t2}`);

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('forbidden');
    expect(typeof res.body.requestId).toBe('string');
  });

  it('allows first user as admin when ADMIN_EMAIL is unset', async () => {
    // With Iter69 Option 2 default, demo@learnflow.ai is always admin unless overridden.
    const token = await register('demo@learnflow.ai');
    const res = await request(app)
      .get('/api/v1/admin/search-config')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.config).toBeDefined();
    expect(Array.isArray(res.body.config.stage1Templates)).toBe(true);
  });

  it('allows ADMIN_EMAIL override', async () => {
    process.env.ADMIN_EMAIL = 'admin2@test.com';
    const token = await register('admin2@test.com');

    const res = await request(app)
      .get('/api/v1/admin/search-config')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('PUT persists config', async () => {
    const token = await register('demo@learnflow.ai');

    const put = await request(app)
      .put('/api/v1/admin/search-config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        stage1Templates: ['{courseTopic} overview'],
        stage2Templates: ['{lessonTitle} {courseTopic}'],
        perQueryLimit: 3,
        maxSourcesPerLesson: 4,
        maxStage1Queries: 2,
        maxStage2Queries: 2,
        enabledSources: { wikipedia: true, reddit: false },
      });

    expect(put.status).toBe(200);

    expect(put.body.config.perQueryLimit).toBe(3);

    const get = await request(app)
      .get('/api/v1/admin/search-config')
      .set('Authorization', `Bearer ${token}`);

    expect(get.status).toBe(200);
    expect(get.body.config.perQueryLimit).toBe(3);
    expect(get.body.config.enabledSources.reddit).toBe(false);
  });
});
