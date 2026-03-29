import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * MVP honesty regression test:
 * Do not ship fake review/rating structured-data unless backed by real stored reviews.
 */
describe('Marketing structured data (MVP honesty)', () => {
  it('apps/client/index.html must not include AggregateRating schema fields', () => {
    const indexPath = path.join(process.cwd(), 'index.html');
    const html = fs.readFileSync(indexPath, 'utf8');

    // JSON-LD fields we want to keep out of MVP builds.
    expect(html).not.toMatch(/aggregateRating/i);
    expect(html).not.toMatch(/ratingValue/i);
    expect(html).not.toMatch(/reviewCount/i);
    expect(html).not.toMatch(/ratingCount/i);
    expect(html).not.toMatch(/12,000|12000/);
  });
});
