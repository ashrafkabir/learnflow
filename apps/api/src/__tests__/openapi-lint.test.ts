import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

// Iter87: basic OpenAPI contract hygiene.

describe('OpenAPI contract', () => {
  it('apps/api/openapi.yaml exists and parses', () => {
    const p = path.join(process.cwd(), 'openapi.yaml');
    expect(fs.existsSync(p)).toBe(true);

    const raw = fs.readFileSync(p, 'utf8');
    const doc = yaml.load(raw) as any;

    expect(doc).toBeTruthy();
    expect(doc.openapi).toMatch(/^3\./);
    expect(doc.paths).toBeTruthy();
  });
});
