import { describe, it, expect, beforeEach } from 'vitest';
import { getEncryptionKey } from '../config.js';

describe('Iter78: encryption config safety', () => {
  beforeEach(() => {
    // Ensure each test starts clean.
    delete process.env.NODE_ENV;
    delete process.env.ENCRYPTION_KEY;
  });

  it('allows dev default encryption key in non-production', () => {
    process.env.NODE_ENV = 'development';
    expect(getEncryptionKey()).toBe('a'.repeat(64));
  });

  it('throws on production when ENCRYPTION_KEY is missing/blank', () => {
    process.env.NODE_ENV = 'production';
    // do not set ENCRYPTION_KEY
    expect(() => getEncryptionKey()).toThrow(/ENCRYPTION_KEY is required in production/i);
  });
});
