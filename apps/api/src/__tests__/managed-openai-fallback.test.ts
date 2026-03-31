import { describe, expect, it, beforeEach, afterEach } from 'vitest';

// IMPORTANT: this file imports the module under test dynamically so env vars apply.

describe('managed OpenAI fallback (dev/demo only)', () => {
  const prev = { ...process.env };

  beforeEach(() => {
    process.env = { ...prev };
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it('does not use managed env key by default', async () => {
    process.env.OPENAI_API_KEY = 'sk-managed-test';
    delete process.env.LEARNFLOW_ALLOW_MANAGED_OPENAI;

    const mod = await import('../llm/openai.js');
    const r = mod.getOpenAIForRequest({ userId: 'u1', tier: 'free' });
    expect(r.source.kind).toBe('none');
    expect(r.client).toBeNull();
  });

  it('uses managed env key when explicitly enabled', async () => {
    process.env.OPENAI_API_KEY = 'sk-managed-test';
    process.env.LEARNFLOW_ALLOW_MANAGED_OPENAI = '1';

    const mod = await import('../llm/openai.js');
    const r = mod.getOpenAIForRequest({ userId: 'u1', tier: 'free' });
    expect(r.source.kind).toBe('managed_env');
    expect(r.client).toBeTruthy();
  });
});

it('uses managed env key when dev auth is enabled (demo)', async () => {
  process.env.OPENAI_API_KEY = 'sk-managed-test';
  process.env.LEARNFLOW_DEV_AUTH = '1';

  const mod = await import('../llm/openai.js');
  const r = mod.getOpenAIForRequest({ userId: 'u1', tier: 'free' });
  expect(r.source.kind).toBe('managed_env');
  expect(r.client).toBeTruthy();
});

it('can explicitly disable managed env fallback even in dev auth', async () => {
  process.env.OPENAI_API_KEY = 'sk-managed-test';
  process.env.LEARNFLOW_DEV_AUTH = '1';
  process.env.LEARNFLOW_DISABLE_MANAGED_OPENAI = '1';

  const mod = await import('../llm/openai.js');
  const r = mod.getOpenAIForRequest({ userId: 'u1', tier: 'free' });
  expect(r.source.kind).toBe('none');
  expect(r.client).toBeNull();
});
