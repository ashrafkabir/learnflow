import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock validator before importing the app.
vi.mock('../llm/key-validation.js', () => {
  return {
    validateKeyWithProvider: vi.fn(async () => true),
  };
});

import request from 'supertest';
import { createApp } from '../app.js';
import { validateKeyWithProvider } from '../llm/key-validation.js';

describe('Iter85: validate-on-save for BYOAI keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/v1/keys with validate=true calls validator and returns validation fields', async () => {
    const app = createApp();

    // register
    const email = `u-${Date.now()}@example.com`;
    const password = 'password123';

    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password, displayName: 'User' })
      .expect(201);

    const token = reg.body.accessToken;

    const res = await request(app)
      .post('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'openai', apiKey: 'sk-test', validate: true })
      .expect(201);

    expect(validateKeyWithProvider).toHaveBeenCalledTimes(1);
    expect(validateKeyWithProvider).toHaveBeenCalledWith({ provider: 'openai', apiKey: 'sk-test' });

    expect(res.body.validationStatus).toBe('valid');
    expect(typeof res.body.validatedAt).toBe('string');
  });
});
