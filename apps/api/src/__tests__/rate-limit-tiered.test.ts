import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp, clearRateLimits, RATE_LIMITS } from '../app.js';
import { config } from '../config.js';

function makeToken(tier: 'free' | 'pro') {
  return jwt.sign(
    { sub: `u-${tier}`, email: `${tier}@test.com`, role: 'student', tier },
    config.jwtSecret,
    { expiresIn: '1h' },
  );
}

describe('Tiered rate limiting', () => {
  beforeEach(() => clearRateLimits());

  it(
    'enforces distinct limits (free vs pro) and returns consistent 429 error shape',
    { timeout: 60_000 },
    async () => {
      const app = createApp();

      const freeToken = makeToken('free');
      const proToken = makeToken('pro');

      // Hit free limit
      let free429: any = null;
      for (let i = 0; i < RATE_LIMITS.free.perMinute + 5; i++) {
        const res = await request(app)
          .post('/api/v1/chat')
          .set('Authorization', `Bearer ${freeToken}`)
          .send({ message: 'hi' });
        if (res.status === 429) {
          free429 = res;
          break;
        }
      }
      expect(free429).toBeTruthy();
      expect(free429.body?.error).toBe('rate_limit_exceeded');
      expect(free429.body?.code).toBe(429);
      expect(free429.body?.tier).toBe('free');
      expect(free429.body?.limitPerMinute).toBe(RATE_LIMITS.free.perMinute);
      expect(typeof free429.body?.retryAfterSeconds).toBe('number');

      // Pro user should still be allowed beyond free cap (within pro cap)
      let proFirst429At: number | null = null;
      for (let i = 0; i < RATE_LIMITS.free.perMinute + 10; i++) {
        const res = await request(app)
          .post('/api/v1/chat')
          .set('Authorization', `Bearer ${proToken}`)
          .send({ message: 'hi' });
        if (res.status === 429) {
          proFirst429At = i;
          break;
        }
      }
      expect(proFirst429At).toBeNull();
    },
  );
});
