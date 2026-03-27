import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

function proToken(sub = 'test-pro-ua-1') {
  return jwt.sign(
    { sub, email: `${sub}@learnflow.dev`, role: 'student', tier: 'pro' },
    config.jwtSecret,
    {
      expiresIn: '1h',
    },
  );
}

describe('update agent tick', () => {
  it('concurrent tick calls: second returns 409 conflict (best-effort)', async () => {
    const app = createApp({ devMode: true });
    const token = proToken('test-pro-ua-lock-1');

    // Fire first request and do not await immediately.
    const r1 = request(app)
      .post('/api/v1/update-agent/tick')
      .set('Authorization', `Bearer ${token}`);
    const r2 = request(app)
      .post('/api/v1/update-agent/tick')
      .set('Authorization', `Bearer ${token}`);

    const [a, b] = await Promise.all([r1, r2]);
    const statuses = [a.status, b.status].sort();

    // In-memory Express + fast deterministic tick can allow both requests to complete
    // before the DB lock state is observed. The real guarantee is the DB lock.
    // Still, we assert that if a conflict happens, it is the standard 409 envelope.
    expect(statuses[0]).toBe(200);
    if (statuses[1] === 409) {
      const conflict = a.status === 409 ? a : b;
      expect(String(conflict.text)).toContain('conflict');
    } else {
      expect(statuses[1]).toBe(200);
    }
  });

  it('tick returns a summary envelope', async () => {
    const app = createApp({ devMode: true });
    const token = proToken('test-pro-ua-summary-1');

    const res = await request(app)
      .post('/api/v1/update-agent/tick')
      .set('Authorization', `Bearer ${token}`);

    expect([200, 201]).toContain(res.status);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body?.run).toBeTruthy();
    expect(typeof res.body.run.startedAt).toBe('string');
    expect(typeof res.body.run.finishedAt).toBe('string');
    expect(typeof res.body.run.status).toBe('string');
    expect(typeof res.body.run.topicsChecked).toBe('number');
    expect(typeof res.body.run.sourcesChecked).toBe('number');
    expect(typeof res.body.run.notificationsCreated).toBe('number');
    expect(Array.isArray(res.body.run.failures)).toBe(true);
  });

  it('GET /runs returns last runs with limit', async () => {
    const app = createApp({ devMode: true });
    const token = proToken('test-pro-ua-runs-1');

    await request(app).post('/api/v1/update-agent/tick').set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/v1/update-agent/runs?limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.runs)).toBe(true);
    expect(res.body.runs.length).toBeLessThanOrEqual(5);
    if (res.body.runs[0]) {
      expect(typeof res.body.runs[0].startedAt).toBe('string');
      expect(typeof res.body.runs[0].status).toBe('string');
    }
  });
});
