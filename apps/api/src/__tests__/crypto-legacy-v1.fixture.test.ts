import { describe, expect, it } from 'vitest';
import { createCipheriv } from 'node:crypto';
import { config } from '../config.js';
import { decrypt } from '../crypto.js';

describe('crypto legacy v1_cbc compatibility', () => {
  it('decrypts v1_cbc ciphertext produced by aes-256-cbc', () => {
    const key = Buffer.from(config.encryptionKey, 'hex');
    const iv = Buffer.alloc(16, 1);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    const plaintext = 'legacy-secret-plaintext';
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const back = decrypt({ encrypted, iv: iv.toString('hex'), encVersion: 'v1_cbc' });
    expect(back).toBe(plaintext);
  });
});
