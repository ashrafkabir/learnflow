import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { config } from './config.js';
import { db, DbUser } from './db.js';
import { sendError } from './errors.js';
import { validateBody } from './validation.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function generateTokens(user: DbUser): { accessToken: string; refreshToken: string } {
  const payload = { sub: user.id, email: user.email, role: user.role, tier: user.tier };
  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' as unknown as number });
  const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, config.jwtSecret, {
    expiresIn: '7d' as unknown as number,
  });

  db.refreshTokens.set(refreshToken, {
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
}

/** POST /api/v1/auth/register */
router.post('/register', validateBody(registerSchema), async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;

  // Dev auth bypass mode (LEARNFLOW_DEV_AUTH=1): avoid slow bcrypt hashing that can stall
  // low-resource dev environments. This endpoint is not intended for real auth flows in MVP.
  if (config.devMode) {
    // Create or reuse a user record; store a placeholder hash to keep schema consistent.
    let user = db.findUserByEmail(email);
    if (!user) {
      user = {
        id: uuidv4(),
        email,
        displayName,
        passwordHash: 'DEV_AUTH_BYPASS',
        role: 'student',
        tier: 'free',
        goals: [],
        preferredLanguage: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      db.addUser(user);
    }

    const tokens = generateTokens(user);
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        tier: user.tier,
        onboardingCompletedAt: (user as any).onboardingCompletedAt
          ? (user as any).onboardingCompletedAt.toISOString?.() ||
            (user as any).onboardingCompletedAt
          : null,
      },
      ...tokens,
    });
    return;
  }

  if (db.findUserByEmail(email)) {
    sendError(res, req, { status: 409, code: 'conflict', message: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  const user: DbUser = {
    id: uuidv4(),
    email,
    displayName,
    passwordHash,
    role: 'student',
    tier: 'free',
    goals: [],
    preferredLanguage: 'en',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  db.addUser(user);
  const tokens = generateTokens(user);

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      tier: user.tier,
      onboardingCompletedAt: (user as any).onboardingCompletedAt
        ? (user as any).onboardingCompletedAt.toISOString?.() || (user as any).onboardingCompletedAt
        : null,
    },
    ...tokens,
  });
});

/** POST /api/v1/auth/login */
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Dev auth bypass mode (LEARNFLOW_DEV_AUTH=1): accept any password for existing users.
  // This prevents bcrypt.compare from stalling in constrained dev environments.
  if (config.devMode) {
    const user = db.findUserByEmail(email) || {
      id: 'test-user-1',
      email,
      displayName: 'Dev User',
      passwordHash: 'DEV_AUTH_BYPASS',
      role: 'student' as const,
      tier: 'free' as const,
      goals: [],
      preferredLanguage: 'en',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // If user doesn't exist yet, create it (so subsequent calls are stable).
    if (!db.findUserByEmail(email)) {
      db.addUser(user as any);
    }

    const tokens = generateTokens(user as any);
    res.status(200).json({
      user: {
        id: (user as any).id,
        email: (user as any).email,
        displayName: (user as any).displayName,
        role: (user as any).role,
        tier: (user as any).tier,
        onboardingCompletedAt: (user as any).onboardingCompletedAt
          ? (user as any).onboardingCompletedAt.toISOString?.() ||
            (user as any).onboardingCompletedAt
          : null,
      },
      ...tokens,
    });
    return;
  }

  const user = db.findUserByEmail(email);

  if (!user) {
    sendError(res, req, { status: 401, code: 'unauthorized', message: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    sendError(res, req, { status: 401, code: 'unauthorized', message: 'Invalid credentials' });
    return;
  }

  const tokens = generateTokens(user);
  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      tier: user.tier,
      onboardingCompletedAt: (user as any).onboardingCompletedAt
        ? (user as any).onboardingCompletedAt.toISOString?.() || (user as any).onboardingCompletedAt
        : null,
    },
    ...tokens,
  });
});

/** POST /api/v1/auth/refresh */
router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    sendError(res, req, { status: 400, code: 'missing_token', message: 'Refresh token required' });
    return;
  }

  const stored = db.refreshTokens.get(refreshToken);
  if (!stored || stored.expiresAt < new Date()) {
    sendError(res, req, {
      status: 401,
      code: 'invalid_token',
      message: 'Invalid or expired refresh token',
    });
    return;
  }

  try {
    jwt.verify(refreshToken, config.jwtSecret);
  } catch {
    sendError(res, req, { status: 401, code: 'invalid_token', message: 'Invalid refresh token' });
    return;
  }

  const user = db.findUserById(stored.userId);
  if (!user) {
    sendError(res, req, { status: 401, code: 'user_not_found', message: 'User not found' });
    return;
  }

  // Remove old refresh token
  db.refreshTokens.delete(refreshToken);

  const tokens = generateTokens(user);
  res.status(200).json(tokens);
});

/** GET /api/v1/auth/google/callback — mock OAuth for Google */
router.get('/google/callback', (req: Request, res: Response) => {
  if (!config.enableMockOAuth) {
    // Hide this dev-only route by default to avoid implying shipped OAuth.
    res.status(404).json({ error: 'not_found' });
    return;
  }
  const { code } = req.query;
  if (!code) {
    sendError(res, req, { status: 400, code: 'missing_code', message: 'OAuth code required' });
    return;
  }

  // Mock: treat code as "google-user-{code}"
  const oauthId = `google-${code}`;
  let user = db.findUserByOAuth('google', oauthId);

  if (!user) {
    user = {
      id: uuidv4(),
      email: `${code}@gmail.com`,
      displayName: `Google User ${code}`,
      passwordHash: '', // OAuth users have no password
      role: 'student',
      tier: 'free',
      goals: [],
      preferredLanguage: 'en',
      oauthProvider: 'google',
      oauthId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.addUser(user);
  }

  const tokens = generateTokens(user);
  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      tier: user.tier,
      onboardingCompletedAt: (user as any).onboardingCompletedAt
        ? (user as any).onboardingCompletedAt.toISOString?.() || (user as any).onboardingCompletedAt
        : null,
    },
    ...tokens,
  });
});

export const authRouter = router;
