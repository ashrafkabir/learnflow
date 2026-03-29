import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

// P0 BYOAI provider selection end-to-end.
// MVP: saving keys should drive provider attribution recorded in usage_records.

describe('P0 BYOAI: saved keys drive provider attribution', () => {
  const app = createApp();

  beforeEach(() => {
    db.clear();
    clearRateLimits();
  });

  it('saving an Anthropic key then chatting records provider=anthropic (OpenAI-only build)', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: `u-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' })
      .expect(201);

    const token = reg.body.accessToken as string;
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    const userId = payload.sub as string;

    await request(app)
      .post('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'anthropic', apiKey: 'sk-ant-abcdefghijklmnopqrstuvwxyz1234567890' })
      .expect(201);

    await request(app)
      .post('/api/v1/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Explain CAP theorem in one paragraph.' })
      .expect(200);

    // NOTE: we don't expose a typed query helper for usage_records yet.
    // Use sqlite directly in tests.
    const { sqlite } = await import('../db.js');
    const rows = sqlite
      .prepare(
        'SELECT provider, agentName, tokensTotal FROM usage_records WHERE userId = ? ORDER BY id DESC LIMIT 5',
      )
      .all(userId) as any[];

    expect(Array.isArray(rows)).toBe(true);
    const latest = rows[0];
    expect(latest).toBeTruthy();
    expect(latest.provider).toBe('anthropic');
    expect(typeof latest.agentName).toBe('string');
  });
});
