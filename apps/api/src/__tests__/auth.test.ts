import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import { db } from '../db.js';
import { config } from '../config.js';
import { encrypt, decrypt } from '../crypto.js';

const app = createApp();

beforeEach(() => {
  db.clear();
});

// S02-A01: POST /api/v1/auth/register creates user and returns JWT
describe('S02-A01: POST /api/v1/auth/register', () => {
  it('creates user and returns JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'password123', displayName: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.role).toBe('student');
    expect(res.body.user.tier).toBe('free');

    // Verify JWT is valid
    const decoded = jwt.verify(res.body.accessToken, config.jwtSecret) as Record<string, unknown>;
    expect(decoded.sub).toBe(res.body.user.id);
    expect(decoded.email).toBe('test@example.com');
  });
});

// S02-A02: POST /api/v1/auth/login returns JWT for valid credentials
describe('S02-A02: POST /api/v1/auth/login', () => {
  it('returns JWT for valid credentials', async () => {
    // Register first
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'login@example.com', password: 'password123', displayName: 'Login User' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
  });
});

// S02-A03: POST /api/v1/auth/login rejects invalid credentials
describe('S02-A03: POST /api/v1/auth/login rejects invalid credentials', () => {
  it('rejects wrong password', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'bad@example.com', password: 'password123', displayName: 'Bad User' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bad@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error?.code).toBe('unauthorized');
  });

  it('rejects non-existent user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });
});

// S02-A04: JWT refresh endpoint issues new token before expiry
describe('S02-A04: JWT refresh', () => {
  it('issues new token with valid refresh token', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'refresh@example.com', password: 'password123', displayName: 'Refresh User' });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: reg.body.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    // New tokens are valid JWTs
    const decoded = jwt.verify(res.body.accessToken, config.jwtSecret) as Record<string, unknown>;
    expect(decoded.sub).toBeDefined();
  });
});

// S02-A05: OAuth flow works for Google provider (dev-only mock)
describe('S02-A05: OAuth Google callback (mock, env-gated)', () => {
  it('returns 404 by default (mock OAuth disabled)', async () => {
    const res = await request(app).get('/api/v1/auth/google/callback?code=testuser123');
    expect(res.status).toBe(404);
  });

  it('creates user + returns JWT when ENABLE_MOCK_OAUTH=true', async () => {
    const prev = process.env.ENABLE_MOCK_OAUTH;
    process.env.ENABLE_MOCK_OAUTH = 'true';

    // Re-import modules so config re-reads env.
    vi.resetModules();
    const { createApp: createGatedApp } = await import('../app.js');
    const { config: gatedConfig } = await import('../config.js');

    const gatedApp = createGatedApp({ devMode: gatedConfig.devMode });
    const res = await request(gatedApp).get('/api/v1/auth/google/callback?code=testuser123');

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('testuser123@gmail.com');
    expect(res.body.user.displayName).toContain('Google User');

    process.env.ENABLE_MOCK_OAUTH = prev;
  });

  it('returns same user on second OAuth login when enabled', async () => {
    const prev = process.env.ENABLE_MOCK_OAUTH;
    process.env.ENABLE_MOCK_OAUTH = 'true';

    vi.resetModules();
    const { createApp: createGatedApp } = await import('../app.js');
    const { config: gatedConfig } = await import('../config.js');

    const gatedApp = createGatedApp({ devMode: gatedConfig.devMode });

    const res1 = await request(gatedApp).get('/api/v1/auth/google/callback?code=repeat');
    const res2 = await request(gatedApp).get('/api/v1/auth/google/callback?code=repeat');

    expect(res1.body.user.id).toBe(res2.body.user.id);

    process.env.ENABLE_MOCK_OAUTH = prev;
  });
});

// S02-A06: POST /api/v1/keys stores API key encrypted (AES-256)
describe('S02-A06: Store API key encrypted', () => {
  it('stores key encrypted in DB', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'keys@example.com', password: 'password123', displayName: 'Key User' });

    const res = await request(app)
      .post('/api/v1/keys')
      .set('Authorization', `Bearer ${reg.body.accessToken}`)
      .send({ provider: 'openai', apiKey: 'sk-testkey1234567890abcdefghijk' });

    expect(res.status).toBe(201);
    expect(res.body.maskedKey).toMatch(/^sk-\.\.\..*$/);

    // Verify it's actually encrypted in the DB
    const dbKey = db.findApiKeyById(res.body.id);
    expect(dbKey).toBeDefined();
    expect(dbKey!.encryptedKey).not.toBe('sk-testkey1234567890abcdefghijk');
    expect(dbKey!.iv).toBeDefined();

    // Verify we can decrypt it
    const decrypted = decrypt({
      encrypted: dbKey!.encryptedKey,
      iv: dbKey!.iv,
      tag: (dbKey as any).tag,
      encVersion: (dbKey as any).encVersion,
    });
    expect(decrypted).toBe('sk-testkey1234567890abcdefghijk');
  });
});

// S02-A07: GET /api/v1/keys returns keys with masked values
describe('S02-A07: List keys with masked values', () => {
  it('returns masked keys', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'masked@example.com', password: 'password123', displayName: 'Mask User' });

    const token = reg.body.accessToken;

    await request(app)
      .post('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'openai', apiKey: 'sk-abc123def456ghi789jkl0mnop' });

    const res = await request(app).get('/api/v1/keys').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.keys).toHaveLength(1);
    expect(res.body.keys[0].maskedKey).toMatch(/^sk-\.\.\..{4}$/);
    // Ensure raw key is NOT in response
    expect(JSON.stringify(res.body)).not.toContain('sk-abc123def456ghi789jkl0mnop');
  });
});

// S02-A08: API key validation rejects invalid/expired keys
describe('S02-A08: Key validation rejects invalid keys', () => {
  it('rejects invalid OpenAI key format', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'validate@example.com', password: 'password123', displayName: 'Val User' });

    const res = await request(app)
      .post('/api/v1/keys/validate')
      .set('Authorization', `Bearer ${reg.body.accessToken}`)
      .send({ provider: 'openai', apiKey: 'bad-key' });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('invalid_key');
    expect(typeof res.body.requestId).toBe('string');
  });
});

// S02-A09: API keys are never logged in application logs
describe('S02-A09: Keys never logged', () => {
  it('does not contain raw keys in any response body', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'nolog@example.com', password: 'password123', displayName: 'Log User' });

    const secretKey = 'sk-supersecretkey1234567890abcdef';
    const token = reg.body.accessToken;

    // Store key
    const storeRes = await request(app)
      .post('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'openai', apiKey: secretKey });

    // List keys
    const listRes = await request(app).get('/api/v1/keys').set('Authorization', `Bearer ${token}`);

    // Verify raw key never appears in any response
    expect(JSON.stringify(storeRes.body)).not.toContain(secretKey);
    expect(JSON.stringify(listRes.body)).not.toContain(secretKey);
  });
});

// S02-A10: Passwords are hashed with bcrypt (cost >= 12)
describe('S02-A10: Passwords hashed with bcrypt cost >= 12', () => {
  it('stores password with bcrypt and rounds >= 12', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'bcrypt@example.com', password: 'password123', displayName: 'Bcrypt User' });

    const user = db.findUserByEmail('bcrypt@example.com');
    expect(user).toBeDefined();
    expect(user!.passwordHash).toMatch(/^\$2[aby]\$/);

    // Extract rounds from bcrypt hash
    const rounds = parseInt(user!.passwordHash.split('$')[2], 10);
    expect(rounds).toBeGreaterThanOrEqual(12);
  });
});

// S02-A11: Auth middleware correctly types req.user with role info
describe('S02-A11: Auth middleware types req.user', () => {
  it('attaches typed user with role and tier to req', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'typed@example.com', password: 'password123', displayName: 'Typed User' });

    // Access a protected endpoint
    const res = await request(app)
      .get('/api/v1/keys')
      .set('Authorization', `Bearer ${reg.body.accessToken}`);

    expect(res.status).toBe(200);
    // The fact that the endpoint works proves middleware attached req.user
    // Type correctness is verified by tsc --noEmit (compile test)
  });
});

// S02-A12: Key encryption/decryption roundtrip works
describe('S02-A12: Encryption roundtrip', () => {
  it('encrypts and decrypts back to original', () => {
    const original = 'sk-test1234567890abcdefghijklmnopqr';
    const out = encrypt(original);

    expect(out.encrypted).not.toBe(original);
    expect(out.iv).toBeDefined();
    expect(out.tag).toBeDefined();

    const decrypted = decrypt({
      encrypted: out.encrypted,
      iv: out.iv,
      tag: out.tag,
      encVersion: out.encVersion,
    });
    expect(decrypted).toBe(original);
  });

  it('different encryptions produce different ciphertexts', () => {
    const original = 'sk-samekey1234567890abcdef';
    const r1 = encrypt(original);
    const r2 = encrypt(original);

    // Due to random IV, ciphertexts should differ
    expect(r1.encrypted).not.toBe(r2.encrypted);
    expect(r1.iv).not.toBe(r2.iv);

    // Both decrypt to same value
    expect(
      decrypt({ encrypted: r1.encrypted, iv: r1.iv, tag: r1.tag, encVersion: r1.encVersion }),
    ).toBe(original);
    expect(
      decrypt({ encrypted: r2.encrypted, iv: r2.iv, tag: r2.tag, encVersion: r2.encVersion }),
    ).toBe(original);
  });
});

// S02-A13: Token usage tracking middleware counts tokens per agent
describe('S02-A13: Token usage tracking', () => {
  it('tracks token usage per agent', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'usage@example.com', password: 'password123', displayName: 'Usage User' });

    const userId = reg.body.user.id;

    // Simulate agent usage by directly adding records
    db.addTokenUsage({ userId, agentId: 'course_builder', tokensUsed: 500, timestamp: new Date() });
    db.addTokenUsage({ userId, agentId: 'course_builder', tokensUsed: 300, timestamp: new Date() });
    db.addTokenUsage({ userId, agentId: 'notes_agent', tokensUsed: 200, timestamp: new Date() });

    expect(db.getTokenUsageByAgent(userId, 'course_builder')).toBe(800);
    expect(db.getTokenUsageByAgent(userId, 'notes_agent')).toBe(200);
    expect(db.getTokenUsageByAgent(userId, 'exam_agent')).toBe(0);
  });
});

// S02-A14: RBAC middleware blocks free users from Pro endpoints
describe('S02-A14: RBAC blocks free users from Pro endpoints', () => {
  it('returns 403 for free user on Pro endpoint', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'free@example.com', password: 'password123', displayName: 'Free User' });

    const res = await request(app)
      .get('/api/v1/pro/features')
      .set('Authorization', `Bearer ${reg.body.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('forbidden');
    expect(typeof res.body.requestId).toBe('string');
  });

  it('returns 200 for pro user on Pro endpoint', async () => {
    // Register, then manually upgrade
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'pro@example.com', password: 'password123', displayName: 'Pro User' });

    const user = db.findUserByEmail('pro@example.com');
    user!.tier = 'pro';
    user!.updatedAt = new Date();
    db.updateUser(user!);

    // Need new token with pro tier
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pro@example.com', password: 'password123' });

    const res = await request(app)
      .get('/api/v1/pro/features')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.features).toBeDefined();
  });
});

// S02-A15: Full auth flow: register → login → add key → list keys
describe('S02-A15: Full auth flow integration', () => {
  it('register → login → add key → list keys', async () => {
    // 1. Register
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'flow@example.com', password: 'password123', displayName: 'Flow User' });
    expect(reg.status).toBe(201);
    expect(reg.body.accessToken).toBeDefined();

    // 2. Login
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'flow@example.com', password: 'password123' });
    expect(login.status).toBe(200);
    const token = login.body.accessToken;

    // 3. Add key
    const addKey = await request(app)
      .post('/api/v1/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ provider: 'openai', apiKey: 'sk-realkey1234567890abcdefghijklm' });
    expect(addKey.status).toBe(201);

    // 4. List keys
    const listKeys = await request(app).get('/api/v1/keys').set('Authorization', `Bearer ${token}`);
    expect(listKeys.status).toBe(200);
    expect(listKeys.body.keys).toHaveLength(1);
    expect(listKeys.body.keys[0].provider).toBe('openai');
    expect(listKeys.body.keys[0].maskedKey).toMatch(/^sk-\.\.\..{4}$/);
  });
});
