import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

const app = createApp();

beforeEach(() => {
  db.clear();
  clearRateLimits();
});

async function registerAndGetToken(): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: `user-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' });
  return res.body.accessToken;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe('Pipeline auth logging', () => {
  it('logs Tavily auth error (401) into pipeline persisted logs (no secrets)', async () => {
    const token = await registerAndGetToken();

    // Force Tavily to be attempted first.
    process.env.TAVILY_API_KEY = 'tvly_test_placeholder_key_which_is_not_real';

    // Mock fetch so the Tavily SDK hits a deterministic 401. Leave other providers untouched.
    const origFetch: any = (globalThis as any).fetch;
    (globalThis as any).fetch = async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      if (url.includes('api.tavily.com')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return origFetch(input, init);
    };

    try {
      const start = await request(app)
        .post('/api/v1/pipeline')
        .set('Authorization', `Bearer ${token}`)
        .send({ topic: 'Auth Logging Topic' });

      expect(start.status).toBe(201);
      const pipelineId = String(start.body.pipelineId);

      // Poll until we see the auth log or pipeline completes.
      const deadline = Date.now() + 20_000;
      let last: any = null;
      while (Date.now() < deadline) {
        const get = await request(app)
          .get(`/api/v1/pipeline/${pipelineId}`)
          .set('Authorization', `Bearer ${token}`);

        if (get.status === 429) {
          await sleep(250);
          continue;
        }

        expect(get.status).toBe(200);
        last = get.body;
        const logs: Array<{ message: string }> = Array.isArray(get.body.logs) ? get.body.logs : [];
        const joined = logs.map((l) => l.message).join('\n');

        if (joined.toLowerCase().includes('tavily auth error')) break;
        if (String(get.body.stage) === 'failed' || String(get.body.status) === 'FAILED') break;
        if (String(get.body.stage) === 'reviewing' || String(get.body.status) === 'SUCCEEDED')
          break;
        await sleep(250);
      }

      expect(last).toBeTruthy();
      const logs: Array<{ message: string }> = Array.isArray(last.logs) ? last.logs : [];
      const joined = logs.map((l) => l.message).join('\n');

      expect(joined).toMatch(/Tavily auth error/i);
      expect(joined).toMatch(/classification=auth_error/i);
      expect(joined).toMatch(/status=401/i);
      expect(joined).toMatch(/check TAVILY_API_KEY/i);

      // Ensure we never log the actual key value.
      expect(joined).not.toContain('tvly_test_placeholder_key_which_is_not_real');
    } finally {
      (globalThis as any).fetch = origFetch;
      delete process.env.TAVILY_API_KEY;
    }
  }, 30_000);
});
