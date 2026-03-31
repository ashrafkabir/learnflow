import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { config } from '../config.js';

function mintToken(args: { sub: string; email: string; tier: 'free' | 'pro' }) {
  return jwt.sign(
    { sub: args.sub, email: args.email, role: 'student', tier: args.tier },
    config.jwtSecret,
    { expiresIn: '1h' },
  );
}

describe('Iter97: Update Agent server-side tier gating', () => {
  beforeEach(() => {
    clearRateLimits();
    db.clear();
  });

  it('Free tier cannot create topics (403 upgrade envelope)', async () => {
    const app = createApp();
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `free-${Date.now()}@test.com`,
        password: 'password123',
        displayName: 'Free',
      })
      .expect(201);

    const regToken = reg.body.accessToken as string;
    const payload = JSON.parse(Buffer.from(regToken.split('.')[1], 'base64url').toString('utf8'));
    const userId = String(payload.sub || '');

    const token = mintToken({ sub: userId, email: String(payload.email || ''), tier: 'free' });

    const res = await request(app)
      .post('/api/v1/update-agent/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'AI Safety', enabled: true });

    expect(res.status).toBe(403);
    expect(String(res.text)).toContain('forbidden');
    expect(String(res.text)).toContain('Requires pro tier');
  });

  it('Free tier cannot add sources (403)', async () => {
    const app = createApp();

    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `free2-${Date.now()}@test.com`,
        password: 'password123',
        displayName: 'Free2',
      })
      .expect(201);

    const regToken = reg.body.accessToken as string;
    const payload = JSON.parse(Buffer.from(regToken.split('.')[1], 'base64url').toString('utf8'));
    const userId = String(payload.sub || '');

    const token = mintToken({ sub: userId, email: String(payload.email || ''), tier: 'free' });

    const res = await request(app)
      .post('/api/v1/update-agent/sources')
      .set('Authorization', `Bearer ${token}`)
      .send({ topicId: 'uat-x', url: 'https://example.com/feed.xml', enabled: true });

    expect(res.status).toBe(403);
    expect(String(res.text)).toContain('Requires pro tier');
  });

  it('Free tier cannot read topics (403)', async () => {
    const app = createApp();

    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `free3-${Date.now()}@test.com`,
        password: 'password123',
        displayName: 'Free3',
      })
      .expect(201);

    const regToken = reg.body.accessToken as string;
    const payload = JSON.parse(Buffer.from(regToken.split('.')[1], 'base64url').toString('utf8'));
    const userId = String(payload.sub || '');

    const token = mintToken({ sub: userId, email: String(payload.email || ''), tier: 'free' });

    const res = await request(app)
      .get('/api/v1/update-agent/topics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(String(res.text)).toContain('Requires pro tier');
  });

  it('Free tier cannot read sources (403)', async () => {
    const app = createApp();

    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `free4-${Date.now()}@test.com`,
        password: 'password123',
        displayName: 'Free4',
      })
      .expect(201);

    const regToken = reg.body.accessToken as string;
    const payload = JSON.parse(Buffer.from(regToken.split('.')[1], 'base64url').toString('utf8'));
    const userId = String(payload.sub || '');

    const token = mintToken({ sub: userId, email: String(payload.email || ''), tier: 'free' });

    const res = await request(app)
      .get('/api/v1/update-agent/sources?topicId=uat-x')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(String(res.text)).toContain('Requires pro tier');
  });
});
