export const JWT_SECRET = process.env.JWT_SECRET || 'learnflow-dev-secret-change-in-production';

function isValidHexKey(maybeHex: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(maybeHex);
}

export function getEncryptionKey(): string {
  const envKey = process.env.ENCRYPTION_KEY;

  if (process.env.NODE_ENV === 'production') {
    if (!envKey || envKey.trim().length === 0) {
      throw new Error('ENCRYPTION_KEY is required in production');
    }
    if (!isValidHexKey(envKey.trim())) {
      throw new Error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
    }
    return envKey.trim();
  }

  // Non-production: allow a deterministic placeholder if none provided.
  const key = (envKey && envKey.trim().length > 0 ? envKey.trim() : 'a'.repeat(64)) as string;
  if (!isValidHexKey(key)) {
    throw new Error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
  }
  return key;
}

export const config = {
  jwtSecret: process.env.JWT_SECRET || 'learnflow-dev-secret-change-in-production',
  jwtExpiresIn: '1h',
  jwtRefreshExpiresIn: '7d',
  bcryptRounds: 12,
  encryptionKey: getEncryptionKey(),
  port: parseInt(process.env.PORT || '3000', 10),
  yjsPort: parseInt(process.env.YJS_PORT || '3002', 10),
  // Dev-mode auth bypass must be explicitly enabled.
  // Never enable in production.
  devMode:
    process.env.NODE_ENV !== 'production' &&
    // Default ON in development unless explicitly disabled.
    process.env.LEARNFLOW_DEV_AUTH !== '0' &&
    process.env.LEARNFLOW_DEV_AUTH !== 'false',
};
