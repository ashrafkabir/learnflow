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

describe('MVP truth: agents must not read process.env.OPENAI_API_KEY', () => {
  it('has no OPENAI_API_KEY env access in shipped agent surfaces (except explicit provider impl/tests)', () => {
    const root = path.join(process.cwd(), 'src');
    const files = walk(root).filter((f) => f.endsWith('.ts'));

    const offenders: Array<{ file: string; line: string }> = [];

    for (const f of files) {
      const rel = path.relative(process.cwd(), f);
      if (rel.includes('__tests__/')) continue;
      // Allow provider implementation modules to read env keys internally.
      // The guardrail is: higher-level agents must not use managed env fallbacks.
      if (rel.includes('content-pipeline/firecrawl-provider')) continue;
      if (rel.includes('content-pipeline/trending-queries')) continue;
      if (rel.includes('content-pipeline/suggested-nodes')) continue;

      const txt = readFileSync(f, 'utf8');
      const lines = txt.split(/\r?\n/);
      lines.forEach((line) => {
        if (line.includes('process.env.OPENAI_API_KEY') || line.includes('env.OPENAI_API_KEY')) {
          offenders.push({ file: rel, line: line.trim() });
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});
