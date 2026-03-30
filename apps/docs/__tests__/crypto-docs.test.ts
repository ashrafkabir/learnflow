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

describe('docs: crypto claims match implementation', () => {
  it('does not claim AES-256-CBC as current (only legacy mention allowed)', () => {
    // Vitest runs with process.cwd() set to this workspace root (apps/docs).
    // Pages folder is relative to that.
    const root = path.join(process.cwd(), 'pages');
    const files = walk(root).filter((f) => f.endsWith('.md'));

    const offenders: string[] = [];
    for (const f of files) {
      const txt = readFileSync(f, 'utf8');
      const has = txt.includes('AES-256-CBC');
      if (!has) continue;

      // Allowed only when explicitly marked legacy/backward-compat.
      const ok = /legacy|backward-compat/i.test(txt);
      if (!ok) offenders.push(path.relative(process.cwd(), f));
    }

    expect(offenders).toEqual([]);
  });
});
