import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function walk(dir: string, out: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

describe('No dev-only hardcoded links in shipped client UI', () => {
  it('does not contain localhost:3003 links in client source', () => {
    const root = path.resolve(__dirname, '..');
    const files = walk(root)
      // avoid scanning test files (including this one)
      .filter((p) => !p.includes(`${path.sep}__tests__${path.sep}`))
      .filter((p) =>
        ['.ts', '.tsx', '.js', '.jsx', '.md', '.css', '.json', '.html', '.mjs', '.cjs'].some(
          (ext) => p.endsWith(ext),
        ),
      );

    const offenders: string[] = [];
    for (const f of files) {
      const txt = fs.readFileSync(f, 'utf8');
      if (txt.includes('localhost:3003') || txt.includes('http://localhost:3003')) {
        offenders.push(path.relative(process.cwd(), f));
      }
    }

    expect(offenders).toEqual([]);
  });
});
