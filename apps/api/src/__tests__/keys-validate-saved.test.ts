import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

// Iter78 P0: validate-saved updates validation metadata and never returns secrets.

describe('Iter78: POST /api/v1/keys/validate-saved', () => {
  const app = createApp();

  beforeEach(() => {
    db.clear();
    clearRateLimits();
  });

  it('marks key as valid (format-only in tests) and persists validatedAt/status', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `u-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' })
      .expect(201);

    const token = reg.body.accessToken;

    const add = await request(app)
      .post('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'openai', apiKey: 'sk-abcdefghijklmnopqrstuvwxyz1234567890' })
      .expect(201);

    const keyId = add.body.id;

    const res = await request(app)
      .post('/api/v1/keys/validate-saved')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'openai' })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.provider).toBe('openai');

    const dbKey = db.findApiKeyById(keyId);
    expect(dbKey).toBeDefined();
    expect(dbKey!.lastValidationStatus).toBe('valid');
    expect(dbKey!.validatedAt).toBeInstanceOf(Date);
  });

  it('returns 404 when no active key exists', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `u2-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' })
      .expect(201);

    const token = reg.body.accessToken;

    await request(app)
      .post('/api/v1/keys/validate-saved')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'openai' })
      .expect(404);
  });
});
