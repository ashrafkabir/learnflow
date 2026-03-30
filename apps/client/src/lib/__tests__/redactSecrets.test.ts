import { describe, it, expect } from 'vitest';

import { redactSecrets } from '../redactSecrets.js';

describe('redactSecrets (client)', () => {
  it('redacts common secret patterns', () => {
    const input =
      'sk-1234567890ABCDEF some tvly-ABCDEFGHIJKL and Bearer abc.def-ghi_jkl plus Bearer sk-LEAKME';
    const out = redactSecrets(input);

    expect(out).not.toMatch(/sk-[A-Za-z0-9]{10,}/);
    expect(out).not.toMatch(/tvly-[A-Za-z0-9]{10,}/);
    expect(out).not.toMatch(/Bearer\s+[A-Za-z0-9._-]{10,}/i);

    expect(out).toMatch(/\[REDACTED\]/);
  });
});
