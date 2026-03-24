import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../app.js';
import { db } from '../db.js';

async function registerAndGetToken(app: any): Promise<{ token: string; userId: string }> {
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: `iter83-${Date.now()}@test.com`,
      password: 'password123',
      displayName: 'Iter83',
    })
    .expect(201);

  const token = reg.body.accessToken as string;
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
  return { token, userId: payload.sub as string };
}

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Example</title>
<item><title>Item One about AI safety</title><link>https://example.com/one?utm_source=x</link><pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate><description><![CDATA[AI safety update]]></description></item>
<item><title>Item Two</title><link>https://example.com/two</link><pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate><description>Other</description></item>
</channel></rss>`;

const rss2 = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Other</title>
<item><title>Different source</title><link>https://other.com/a</link><pubDate>Wed, 03 Jan 2024 00:00:00 GMT</pubDate><description>AI</description></item>
</channel></rss>`;

describe('Iter83: POST /api/v1/notifications/generate (real monitoring MVP)', () => {
  beforeEach(() => {
    db.clear();
  });

  it('first run generates >=1 notification and includes real url + trust fields', async () => {
    const app = createApp();
    const { token } = await registerAndGetToken(app);

    const fetchMock = vi
      .spyOn(globalThis as any, 'fetch')
      .mockResolvedValueOnce(
        new Response(rss, {
          status: 200,
          headers: { 'content-type': 'application/rss+xml' },
        }) as any,
      )
      .mockResolvedValueOnce(
        new Response(rss2, {
          status: 200,
          headers: { 'content-type': 'application/rss+xml' },
        }) as any,
      );

    const gen = await request(app)
      .post('/api/v1/notifications/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'AI Safety' })
      .expect(201);

    expect(gen.body.created).toBeGreaterThanOrEqual(1);

    const list = await request(app)
      .get('/api/v1/notifications?limit=50')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(list.body.notifications)).toBe(true);
    expect(list.body.notifications.length).toBeGreaterThanOrEqual(1);

    const n = list.body.notifications[0];
    expect(typeof n.url).toBe('string');
    expect(n.url.startsWith('http')).toBe(true);
    expect(n.topic.toLowerCase()).toContain('ai');
    expect(typeof n.sourceUrl).toBe('string');
    expect(typeof n.sourceDomain).toBe('string');
    expect(typeof n.explanation).toBe('string');
    expect(n.checkedAt).toBeTruthy();

    fetchMock.mockRestore();
  });

  it('second run dedupes same item url (no duplicates)', async () => {
    const app = createApp();
    const { token } = await registerAndGetToken(app);

    const fetchMock = vi.spyOn(globalThis as any, 'fetch').mockResolvedValue(
      new Response(rss, {
        status: 200,
        headers: { 'content-type': 'application/rss+xml' },
      }) as any,
    );

    await request(app)
      .post('/api/v1/notifications/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'AI Safety' })
      .expect(201);

    await request(app)
      .post('/api/v1/notifications/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'AI Safety' })
      .expect(201);

    const list = await request(app)
      .get('/api/v1/notifications?limit=50')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const urls = list.body.notifications.map((x: any) => x.url).filter(Boolean);
    const set = new Set(urls);
    expect(set.size).toBe(urls.length);

    fetchMock.mockRestore();
  });

  it('failed source is captured and does not abort whole run', async () => {
    const app = createApp();
    const { token } = await registerAndGetToken(app);

    const fetchMock = vi
      .spyOn(globalThis as any, 'fetch')
      .mockResolvedValueOnce(new Response('nope', { status: 500 }) as any)
      .mockResolvedValueOnce(
        new Response(rss, {
          status: 200,
          headers: { 'content-type': 'application/rss+xml' },
        }) as any,
      );

    const gen = await request(app)
      .post('/api/v1/notifications/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'AI Safety' })
      .expect(201);

    expect(Array.isArray(gen.body.failures)).toBe(true);
    expect(gen.body.failures.length).toBeGreaterThanOrEqual(1);
    expect(gen.body.created).toBeGreaterThanOrEqual(0);

    fetchMock.mockRestore();
  }, 15_000);
});
