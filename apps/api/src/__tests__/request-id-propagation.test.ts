import { describe, expect, it } from 'vitest';
import supertest from 'supertest';

import { createApp } from '../app.js';

describe('requestId propagation', () => {
  it('echoes inbound x-request-id to response header', async () => {
    const app = createApp({ devMode: true });

    const res = await supertest(app).get('/health').set('x-request-id', 'rid-test-1');

    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBe('rid-test-1');
  });
});
