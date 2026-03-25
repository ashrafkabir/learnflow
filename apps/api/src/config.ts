export const JWT_SECRET = process.env.JWT_SECRET || 'learnflow-dev-secret-change-in-production';

export const config = {
  jwtSecret: process.env.JWT_SECRET || 'learnflow-dev-secret-change-in-production',
  jwtExpiresIn: '1h',
  jwtRefreshExpiresIn: '7d',
  bcryptRounds: 12,
  // NOTE: do not rely on the fallback in production.
  // CBC requires a strong, secret key (32 bytes hex). See boot-time validation in src/index.ts.
  encryptionKey: process.env.ENCRYPTION_KEY || 'a'.repeat(64), // 32 bytes hex
  port: parseInt(process.env.PORT || '3000', 10),
  yjsPort: parseInt(process.env.YJS_PORT || '3002', 10),

  // API hardening defaults (Iter87)
  api: {
    bodyLimit: process.env.API_BODY_LIMIT || '1mb',
    corsAllowOrigins: process.env.CORS_ALLOW_ORIGINS || '',
  } as const,

  // Dev-mode auth bypass must be explicitly enabled.
  // Never enable in production.
  devMode:
    process.env.NODE_ENV !== 'production' &&
    // Default OFF: explicit opt-in to prevent accidental unsafe/real builds during harness runs.
    (process.env.LEARNFLOW_DEV_AUTH === '1' || process.env.LEARNFLOW_DEV_AUTH === 'true'),
};
