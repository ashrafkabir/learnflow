import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, clearRateLimits } from '../app.js';
import { db } from '../db.js';
import { courses } from '../routes/courses.js';

// Iter72 regression suite: outline topic-adaptivity + quantum profile ordering.
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

describe('Iter72: topic-adaptive outline regression', () => {
  it('quantum topic produces exact module order per quantum domain profile (normalized strict match)', async () => {
    const token = await registerAndGetToken();

    const create = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Quantum computing', depth: 'beginner', title: 'QC 101' });

    expect(create.status).toBe(201);
    const modules = create.body.modules as Array<{ title: string }>;
    expect(Array.isArray(modules)).toBe(true);

    const got = modules.map((m) => normalizeTitle(m.title));

    // Note: quantum profile titles are intentionally concise; order must match the required structure.
    const expected = [
      'Intro',
      'Math Foundations',
      'Qubits/Physics',
      'Python',
      'Qiskit',
      'Teleportation',
      'Bernstein–Vazirani',
      'Deutsch',
      'Grover',
      'Shor',
      'Next Steps',
    ].map(normalizeTitle);

    expect(got).toEqual(expected);
  });

  it('non-quantum topic (Italian cooking) does not produce quantum modules and contains domain-specific titles', async () => {
    const token = await registerAndGetToken();

    const create = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Italian cooking basics', depth: 'beginner', title: 'Italian Cooking' });

    expect(create.status).toBe(201);
    const modules = create.body.modules as Array<{ title: string }>;
    expect(Array.isArray(modules)).toBe(true);

    const titles = modules.map((m) => String(m.title));
    const normalized = titles.map(normalizeTitle);

    // Must reflect the actual domain/topic in module titles.
    expect(
      normalized.some((t) => t.includes('italian')) ||
        normalized.some((t) => t.includes('cooking')),
    ).toBe(true);

    // Must NOT include quantum-profile modules/keywords.
    const quantumTerms = [
      'qubit',
      'qiskit',
      'teleportation',
      'bernstein',
      'vazirani',
      'deutsch',
      'grover',
      'shor',
    ];

    for (const term of quantumTerms) {
      expect(normalized.some((t) => t.includes(term))).toBe(false);
    }

    // Extra guard: no module should exactly match the quantum required sequence.
    const quantumExpected = [
      'Intro',
      'Math Foundations',
      'Qubits/Physics',
      'Python',
      'Qiskit',
      'Teleportation',
      'Bernstein–Vazirani',
      'Deutsch',
      'Grover',
      'Shor',
      'Next Steps',
    ].map(normalizeTitle);

    expect(normalized).not.toEqual(quantumExpected);
  });
});
