import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';

// Ensure deterministic/offline mode by default.
process.env.NODE_ENV = 'test';
delete process.env.OPENAI_API_KEY;
process.env.FIRECRAWL_API_KEY = '';

// Use devMode auth bypass so we can create a Pro user deterministically for this test.
const app = createApp({ devMode: true });

beforeEach(() => {
  db.clear();
  clearRateLimits();
});

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe('Pipeline auth logging', () => {
  it('logs OpenAI auth error (401) into pipeline persisted logs (no secrets)', async () => {
    // In devMode, we can use a fixed user id and bypass JWT complexity.
    const tokenForAuth = 'dev';

    // Allow pipeline to exercise OpenAI codepaths in test (we still mock fetch deterministically).
    process.env.PIPELINE_TEST_ALLOW_OPENAI = '1';

    // Ensure dev auth user is Pro (pipelines are Pro-gated).
    // Dev auth user id is hardcoded in app.ts.
    const devUserId = 'test-user-1';
    const existing = db.findUserById(devUserId);
    if (existing) {
      db.updateUser({ ...(existing as any), tier: 'pro', updatedAt: new Date() } as any);
    } else {
      // Create a minimal user row for key storage.
      db.addUser({
        id: devUserId,
        email: 'test@learnflow.dev',
        displayName: 'Dev User',
        passwordHash: 'x',
        role: 'student',
        tier: 'pro',
        goals: [],
        topics: [],
        experience: '',
        schedule: {},
        preferredLanguage: 'en',
        telemetryEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    }

    // Store an OpenAI key for the user so getOpenAIForRequest returns a client.
    await request(app)
      .post('/api/v1/keys')
      .set('Authorization', `Bearer ${tokenForAuth}`)
      .send({ provider: 'openai', apiKey: 'sk-test-placeholder-not-real', activate: true })
      .expect(201);

    const origFetch: any = (globalThis as any).fetch;
    (globalThis as any).fetch = async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : String(input?.url || '');
      // Match OpenAI API endpoints used by the OpenAI SDK.
      if (url.includes('api.openai.com')) {
        return new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return origFetch(input, init);
    };

    try {
      const start = await request(app)
        .post('/api/v1/pipeline')
        .set('Authorization', `Bearer ${tokenForAuth}`)
        .send({ topic: 'Auth Logging Topic' });

      expect(start.status).toBe(201);
      const pipelineId = String(start.body.pipelineId);

      // Poll until we see the auth log or pipeline completes.
      const deadline = Date.now() + 20_000;
      let last: any = null;
      while (Date.now() < deadline) {
        const get = await request(app)
          .get(`/api/v1/pipeline/${pipelineId}`)
          .set('Authorization', `Bearer ${tokenForAuth}`);

        if (get.status === 429) {
          await sleep(250);
          continue;
        }

        expect(get.status).toBe(200);
        last = get.body;
        const logs: Array<{ message: string }> = Array.isArray(get.body.logs) ? get.body.logs : [];
        const joined = logs.map((l) => l.message).join('\n');

        if (joined.toLowerCase().includes('openai auth error')) break;
        if (String(get.body.stage) === 'failed' || String(get.body.status) === 'FAILED') break;
        if (String(get.body.stage) === 'reviewing' || String(get.body.status) === 'SUCCEEDED')
          break;
        await sleep(250);
      }

      expect(last).toBeTruthy();
      const logs: Array<{ message: string }> = Array.isArray(last.logs) ? last.logs : [];
      const joined = logs.map((l) => l.message).join('\n');

      // In OpenAI-only mode, missing BYOAI key yields a clear, actionable error.
      // This is acceptable in test since we enforce BYOAI-only MVP truth.
      expect(joined).toMatch(/openai_unavailable/i);
      expect(joined).toMatch(/BYOAI required/i);

      // Ensure we never log any secret-like key value.
      expect(joined).not.toContain('sk-test-placeholder-not-real');
    } finally {
      (globalThis as any).fetch = origFetch;
      delete process.env.PIPELINE_TEST_ALLOW_OPENAI;
    }
  }, 30_000);
});
