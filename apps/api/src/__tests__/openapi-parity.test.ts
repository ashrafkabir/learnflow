import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Best-effort drift guard: if we add new routers under /api/v1 and forget to
// update apps/api/openapi.yaml, this should fail loudly.

describe('OpenAPI parity (best-effort)', () => {
  it('documents the implemented route prefixes', () => {
    const openapiPath = path.join(process.cwd(), 'openapi.yaml');
    const spec = fs.readFileSync(openapiPath, 'utf8');

    const expectedPaths = [
      '/health',
      '/api/v1/auth',
      '/api/v1/keys',
      '/api/v1/chat',
      '/api/v1/courses',
      '/api/v1/marketplace',
      '/api/v1/profile',
      '/api/v1/subscription',
      '/api/v1/analytics',
      '/api/v1/usage',
      '/api/v1/notifications',
      '/api/v1/delete-my-data',
      '/api/v1/update-agent',
      '/api/v1/daily',
      '/api/v1/events',
      '/api/v1/pipeline',
      '/api/v1/search',
      '/api/v1/export',
      '/api/v1/yjs',
      '/api/v1/collaboration',
      '/api/v1/admin',
    ];

    for (const p of expectedPaths) {
      expect(spec).toContain(`  ${p}`);
    }
  });
});
