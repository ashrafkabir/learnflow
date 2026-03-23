export const JWT_SECRET = process.env.JWT_SECRET || 'learnflow-dev-secret-change-in-production';

export const config = {
  jwtSecret: process.env.JWT_SECRET || 'learnflow-dev-secret-change-in-production',
  jwtExpiresIn: '1h',
  jwtRefreshExpiresIn: '7d',
  bcryptRounds: 12,
  encryptionKey: process.env.ENCRYPTION_KEY || 'a'.repeat(64), // 32 bytes hex
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
