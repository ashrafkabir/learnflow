import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { config } from './config.js';

export type EncryptionVersion = 'v1_cbc' | 'v2_gcm';

const V1_ALGORITHM = 'aes-256-cbc';
const V2_ALGORITHM = 'aes-256-gcm';

function getKeyBuffer(): Buffer {
  return Buffer.from(config.encryptionKey, 'hex');
}

export function encrypt(plaintext: string): {
  encrypted: string;
  iv: string;
  tag: string;
  encVersion: EncryptionVersion;
} {
  // Iter97: Default to modern AEAD.
  const iv = randomBytes(12); // recommended IV size for GCM
  const cipher = createCipheriv(V2_ALGORITHM, getKeyBuffer(), iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    encVersion: 'v2_gcm',
  };
}

export function decrypt(
  args:
    | {
        encrypted: string;
        iv: string;
        tag?: string;
        encVersion?: EncryptionVersion | string;
      }
    | string,
  ivHex?: string,
): string {
  // Backwards compatible signature: decrypt(encrypted, iv)
  if (typeof args === 'string') {
    const encrypted = args;
    const iv = String(ivHex || '');
    const decipher = createDecipheriv(V1_ALGORITHM, getKeyBuffer(), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  const encVersion = (args.encVersion || 'v1_cbc') as EncryptionVersion | string;

  if (encVersion === 'v2_gcm') {
    const iv = Buffer.from(args.iv, 'hex');
    const tag = Buffer.from(String(args.tag || ''), 'hex');
    const decipher = createDecipheriv(V2_ALGORITHM, getKeyBuffer(), iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(args.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Legacy: v1_cbc
  const iv = Buffer.from(args.iv, 'hex');
  const decipher = createDecipheriv(V1_ALGORITHM, getKeyBuffer(), iv);
  let decrypted = decipher.update(args.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
