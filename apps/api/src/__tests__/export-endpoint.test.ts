import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

describe('export endpoint', () => {
  it('free tier is markdown-only (default json -> 403)', async () => {
    const app = createApp({ devMode: true });
    const res = await request(app).get('/api/v1/export');
    expect(res.status).toBe(403);
    expect(res.headers['content-type']).toContain('application/json');
    expect(String(res.text)).toContain('upgrade_required');
  });

  it('returns markdown export when format=md', async () => {
    const app = createApp({ devMode: true });
    const res = await request(app).get('/api/v1/export?format=md');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
  });

  it('pro tier can export json by default', async () => {
    const app = createApp({ devMode: true });
    const token = jwt.sign(
      { sub: 'test-user-1', email: 'test@learnflow.dev', role: 'student', tier: 'pro' },
      config.jwtSecret,
      { expiresIn: '1h' },
    );

    const res = await request(app).get('/api/v1/export').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
  });
});
