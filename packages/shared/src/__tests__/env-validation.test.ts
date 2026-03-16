import { describe, it, expect } from 'vitest';
import { envSchema } from '../config/index.js';

describe('envSchema', () => {
  const validEnv = {
    NODE_ENV: 'development',
    PORT: '3000',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/learnflow',
    REDIS_URL: 'redis://localhost:6379',
    MINIO_ENDPOINT: 'localhost:9000',
    MINIO_ACCESS_KEY: 'minioaccess',
    MINIO_SECRET_KEY: 'miniosecret',
    JWT_SECRET: 'a-very-long-secret-that-is-at-least-32-chars',
  };

  it('should validate a correct env', () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it('should reject missing DATABASE_URL', () => {
    const { DATABASE_URL: _unused, ...bad } = validEnv;
    const result = envSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it('should reject invalid NODE_ENV', () => {
    const result = envSchema.safeParse({ ...validEnv, NODE_ENV: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should reject short JWT_SECRET', () => {
    const result = envSchema.safeParse({ ...validEnv, JWT_SECRET: 'short' });
    expect(result.success).toBe(false);
  });

  it('should reject non-numeric PORT', () => {
    const result = envSchema.safeParse({ ...validEnv, PORT: 'abc' });
    expect(result.success).toBe(false);
  });
});
