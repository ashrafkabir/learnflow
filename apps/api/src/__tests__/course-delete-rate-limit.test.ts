import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';

// Regression: deleting a course should not be unexpectedly rate-limited under reasonable bursts.
// Root cause was coarse IP-based keying; we now key by user (sub) when available.

describe('Course deletion rate limiting regression', () => {
  beforeEach(() => {
    clearRateLimits();
  });

  it('does not return 429 when deleting multiple courses in a burst (<= free-tier limit)', async () => {
    const app = createApp({ devMode: true });

    // Create a handful of courses
    const ids: string[] = [];
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post('/api/v1/courses')
        .send({ topic: `Burst ${i}` });
      expect(res.status).toBe(201);
      ids.push(res.body.id);
    }

    // Delete them in a tight loop — should not hit 429 within 100 req/min.
    // (10 creates + 10 deletes = 20 requests)
    for (const id of ids) {
      const del = await request(app).delete(`/api/v1/courses/${id}`);
      expect([204, 404]).toContain(del.status);
      expect(del.status).toBe(204);
    }
  });
});
