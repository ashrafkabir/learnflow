import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { config } from './config.js';
import { db, DbUser } from './db.js';

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
router.post('/register', async (req: Request, res: Response) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const { email, password, displayName } = parse.data;

  if (db.findUserByEmail(email)) {
    res.status(409).json({ error: 'conflict', message: 'Email already registered', code: 409 });
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
    },
    ...tokens,
  });
});

/** POST /api/v1/auth/login */
router.post('/login', async (req: Request, res: Response) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const { email, password } = parse.data;
  const user = db.findUserByEmail(email);

  if (!user) {
    res.status(401).json({ error: 'unauthorized', message: 'Invalid credentials', code: 401 });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'unauthorized', message: 'Invalid credentials', code: 401 });
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
    },
    ...tokens,
  });
});

/** POST /api/v1/auth/refresh */
router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'missing_token', message: 'Refresh token required', code: 400 });
    return;
  }

  const stored = db.refreshTokens.get(refreshToken);
  if (!stored || stored.expiresAt < new Date()) {
    res
      .status(401)
      .json({ error: 'invalid_token', message: 'Invalid or expired refresh token', code: 401 });
    return;
  }

  try {
    jwt.verify(refreshToken, config.jwtSecret);
  } catch {
    res.status(401).json({ error: 'invalid_token', message: 'Invalid refresh token', code: 401 });
    return;
  }

  const user = db.findUserById(stored.userId);
  if (!user) {
    res.status(401).json({ error: 'user_not_found', message: 'User not found', code: 401 });
    return;
  }

  // Remove old refresh token
  db.refreshTokens.delete(refreshToken);

  const tokens = generateTokens(user);
  res.status(200).json(tokens);
});

/** GET /api/v1/auth/google/callback — mock OAuth for Google */
router.get('/google/callback', (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) {
    res.status(400).json({ error: 'missing_code', message: 'OAuth code required', code: 400 });
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
    },
    ...tokens,
  });
});

export const authRouter = router;
