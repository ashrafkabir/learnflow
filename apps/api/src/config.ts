export const JWT_SECRET = process.env.JWT_SECRET || 'learnflow-dev-secret-change-in-production';

export const config = {
  jwtSecret: process.env.JWT_SECRET || 'learnflow-dev-secret-change-in-production',
  jwtExpiresIn: '1h',
  jwtRefreshExpiresIn: '7d',
  bcryptRounds: 12,
  encryptionKey: process.env.ENCRYPTION_KEY || 'a'.repeat(64), // 32 bytes hex
  port: parseInt(process.env.PORT || '3000', 10),
};
