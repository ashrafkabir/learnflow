import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

// Iter72 regression suite extension: ensure module outlines are not a generic template reused across domains.
process.env.NODE_ENV = 'test';
// Force deterministic/offline mode
delete process.env.OPENAI_API_KEY;
process.env.FIRECRAWL_API_KEY = '';

const app = createApp();

beforeEach(() => {
  db.clear();
  courses.clear();
  clearRateLimits();
});

async function registerAndGetToken(): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: `user-${Date.now()}@test.com`, password: 'password123', displayName: 'Test' });
  return res.body.accessToken;
}

function normalizeTitle(s: string): string {
  return String(s)
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  const union = new Set([...A, ...B]);
  let intersectionSize = 0;
  for (const x of A) {
    if (B.has(x)) intersectionSize += 1;
  }
  return union.size === 0 ? 1 : intersectionSize / union.size;
}

async function createCourseAndGetModuleTitles(params: {
  token: string;
  topic: string;
  title: string;
  depth?: 'beginner' | 'intermediate' | 'advanced';
}): Promise<string[]> {
  const create = await request(app)
    .post('/api/v1/courses')
    .set('Authorization', `Bearer ${params.token}`)
    .send({ topic: params.topic, depth: params.depth ?? 'beginner', title: params.title });

  expect(create.status).toBe(201);
  const id = String(create.body.id);

  const deadline = Date.now() + 60_000;
  let last: any = null;
  while (Date.now() < deadline) {
    const getRes = await request(app)
      .get(`/api/v1/courses/${id}`)
      .set('Authorization', `Bearer ${params.token}`);

    expect(getRes.status).toBe(200);
    last = getRes.body;

    if (getRes.body?.status === 'READY') break;
    if (getRes.body?.status === 'FAILED') {
      throw new Error(`Course generation failed: ${getRes.body?.error || 'unknown'}`);
    }

    await new Promise((r) => setTimeout(r, 50));
  }

  const modules = (last?.modules || []) as Array<{ title: string }>;
  expect(Array.isArray(modules)).toBe(true);
  expect(modules.length).toBeGreaterThanOrEqual(4);

  return modules.map((m) => normalizeTitle(m.title));
}

describe('Iter72: outline diversity regression (cross-domain anti-template)', () => {
  it('module title sets differ materially across quantum computing vs italian cooking vs rust programming (pairwise similarity below threshold)', async () => {
    const token = await registerAndGetToken();

    const [quantum, italian, rust] = await Promise.all([
      createCourseAndGetModuleTitles({ token, topic: 'Quantum computing', title: 'QC 101' }),
      createCourseAndGetModuleTitles({
        token,
        topic: 'Italian cooking basics',
        title: 'Italian Cooking',
      }),
      createCourseAndGetModuleTitles({
        token,
        topic: 'Rust programming fundamentals',
        title: 'Rust Fundamentals',
      }),
    ]);

    // Basic sanity: each course should have domain-specific tokens, not a generic “Intro/Core/Advanced/Best Practices” clone.
    expect(
      quantum.some((t) => t.includes('qubit') || t.includes('qiskit') || t.includes('shor')),
    ).toBe(true);
    expect(
      italian.some((t) => t.includes('italian') || t.includes('pasta') || t.includes('sauce')),
    ).toBe(true);
    expect(
      rust.some((t) => t.includes('rust') || t.includes('cargo') || t.includes('ownership')),
    ).toBe(true);

    // Similarity threshold: if outlines reuse the same template across domains, Jaccard similarity will spike.
    // Pick a conservative threshold that still allows a shared “intro”-style module.
    const THRESHOLD = 0.55;

    const simQI = jaccardSimilarity(quantum, italian);
    const simQR = jaccardSimilarity(quantum, rust);
    const simIR = jaccardSimilarity(italian, rust);

    expect(simQI).toBeLessThan(THRESHOLD);
    expect(simQR).toBeLessThan(THRESHOLD);
    expect(simIR).toBeLessThan(THRESHOLD);

    // Extra guard: at least one pair must be *very* dissimilar to catch accidental global templates.
    expect(Math.min(simQI, simQR, simIR)).toBeLessThan(0.35);
  });
});
