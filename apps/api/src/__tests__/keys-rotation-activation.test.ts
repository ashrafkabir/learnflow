import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

// Iter78 P0.1 remainder: multi-key rotation + active selection.

describe('Iter78: API key activation + rotation', () => {
  const app = createApp();

  beforeEach(() => {
    db.clear();
    clearRateLimits();
  });

  it('allows multiple keys per provider and enforces exactly one active key', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `u-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' })
      .expect(201);

    const token = reg.body.accessToken;

    const k1 = await request(app)
      .post('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'openai', apiKey: 'sk-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', label: 'Key A' })
      .expect(201);

    const k2 = await request(app)
      .post('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'openai', apiKey: 'sk-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', label: 'Key B' })
      .expect(201);

    const list1 = await request(app)
      .get('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const openai = list1.body.keys.filter((k: any) => k.provider === 'openai');
    expect(openai.length).toBe(2);
    expect(openai.filter((k: any) => k.active).length).toBe(1);

    // Activate first key explicitly.
    await request(app)
      .post('/api/v1/keys/activate')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: k1.body.id })
      .expect(200);

    const list2 = await request(app)
      .get('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const openai2 = list2.body.keys.filter((k: any) => k.provider === 'openai');
    expect(openai2.filter((k: any) => k.active).length).toBe(1);
    expect(openai2.find((k: any) => k.id === k1.body.id)?.active).toBe(true);
    expect(openai2.find((k: any) => k.id === k2.body.id)?.active).toBe(false);
  });

  it('rotate creates a new active key and marks rotatedAt', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `u2-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' })
      .expect(201);

    const token = reg.body.accessToken;

    await request(app)
      .post('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'openai', apiKey: 'sk-cccccccccccccccccccccccccccccc', label: 'Key C' })
      .expect(201);

    await request(app)
      .post('/api/v1/keys/rotate')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'openai', apiKey: 'sk-dddddddddddddddddddddddddddddd', label: 'Rotated' })
      .expect(201);

    const list = await request(app)
      .get('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const openai = list.body.keys.filter((k: any) => k.provider === 'openai');
    expect(openai.length).toBe(2);

    const active = openai.find((k: any) => k.active);
    expect(active).toBeTruthy();
    expect(active.rotatedAt).toBeTruthy();
  });
});
