import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { db } from '../db.js';

const app = createApp({ devMode: true });

beforeEach(() => {
  db.clear();
});

describe('Iter78 P0.3: notifications generate uses real provider (test-mode deterministic fallback)', () => {
  it('POST /api/v1/notifications/generate creates notifications with real URLs/titles for a topic', async () => {
    const res = await request(app)
      .post('/api/v1/notifications/generate')
      .send({ topic: 'rust programming' });

    expect([200, 201]).toContain(res.status);

    const list = await request(app).get('/api/v1/notifications?limit=50');
    expect(list.status).toBe(200);

    const notifications = list.body.notifications as Array<any>;
    expect(notifications.length).toBeGreaterThanOrEqual(1);

    const body = String(notifications[0].body || '');
    expect(body).toMatch(/https:\/\//);

    const title = String(notifications[0].title || '');
    expect(title.toLowerCase()).toContain('rust');
  });

  it('is idempotent: repeated calls do not create duplicates for the same topic', async () => {
    const first = await request(app)
      .post('/api/v1/notifications/generate')
      .send({ topic: 'quantum computing' });
    expect([200, 201]).toContain(first.status);

    const second = await request(app)
      .post('/api/v1/notifications/generate')
      .send({ topic: 'quantum computing' });
    expect([200, 201]).toContain(second.status);

    const list = await request(app).get('/api/v1/notifications?limit=100');
    expect(list.status).toBe(200);

    const notifications = (list.body.notifications || []) as Array<any>;

    // Our endpoint caps at 3 per run; ids are stable per URL.
    expect(notifications.length).toBeLessThanOrEqual(3);

    // Ensure IDs are unique in the feed.
    const ids = notifications.map((n) => String(n.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
