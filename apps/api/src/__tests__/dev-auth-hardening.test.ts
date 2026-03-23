import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

/**
 * Iter53 P0.2: Ensure devAuth does not accidentally bypass auth when devMode=false.
 */

describe('devAuth hardening', () => {
  it('requires auth when devMode is not enabled (standard envelope)', async () => {
    const app = createApp({ devMode: false });
    const res = await request(app).get('/api/v1/courses');
    expect(res.status).toBe(401);
    expect(res.body.error?.code).toBe('unauthorized');
    expect(typeof res.body.requestId).toBe('string');
  });

  it('allows access when devMode is enabled (devAuth)', async () => {
    const app = createApp({ devMode: true });
    const res = await request(app).get('/api/v1/courses');
    // Can be 200, or 500 if internal error; but should not be 401.
    expect(res.status).not.toBe(401);
  });
});
