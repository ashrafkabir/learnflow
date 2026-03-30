import { describe, it, expect } from 'vitest';

// Keep this test narrow and deterministic. It ensures we never leak common key patterns
// into logs or error messages.

describe('redactSecrets', () => {
  it('redacts OpenAI-style keys, Tavily keys, and Bearer tokens', async () => {
    const { redactSecrets } = await import('../redactSecrets.js');

    const input =
      'sk-1234567890ABCDEF some tvly-ABCDEFGHIJKL and Bearer abc.def-ghi_jkl plus Bearer sk-LEAKME';
    const out = redactSecrets(input);

    expect(out).not.toMatch(/sk-[A-Za-z0-9]{10,}/);
    expect(out).not.toMatch(/tvly-[A-Za-z0-9]{10,}/);
    expect(out).not.toMatch(/Bearer\s+[A-Za-z0-9._-]{10,}/i);

    // Ensure some content preserved for debuggability.
    expect(out).toMatch(/\[REDACTED\]/);
  });
});
