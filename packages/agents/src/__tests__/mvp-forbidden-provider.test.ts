import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

describe('MVP guardrails: forbidden provider strings in shipped agent code', () => {
  it('does not reference Firecrawl as an allowed provider id', () => {
    // Vitest runs with process.cwd() set to this workspace root (packages/agents).
    const root = path.join(process.cwd(), 'src');
    const files = walk(root).filter((f) => f.endsWith('.ts'));

    const offenders: Array<{ file: string; line: string }> = [];
    for (const f of files) {
      const rel = path.relative(process.cwd(), f);
      // Allow explicit experimental/provider implementation files and this guard test itself.
      if (rel.includes('content-pipeline/firecrawl-provider')) continue;
      if (rel.includes('__tests__/firecrawl-content')) continue;
      if (rel.includes('__tests__/mvp-forbidden-provider.test')) continue;

      const txt = readFileSync(f, 'utf8');
      const lines = txt.split(/\r?\n/);
      lines.forEach((line) => {
        if (line.includes("'firecrawl'") || line.includes('"firecrawl"')) {
          offenders.push({ file: rel, line: line.trim() });
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});
