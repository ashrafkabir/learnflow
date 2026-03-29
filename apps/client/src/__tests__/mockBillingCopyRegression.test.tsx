// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import fs from 'node:fs';
import path from 'node:path';

function read(p: string) {
  return fs.readFileSync(p, 'utf8');
}

describe('Mock billing copy regression', () => {
  it('does not mention real billing periods in client settings copy', () => {
    const file = path.resolve(process.cwd(), 'src/screens/ProfileSettings.tsx');
    const text = read(file);

    // We should never imply real billing cycles/periods when billing is mocked.
    expect(text).not.toMatch(/billing period/i);
  });

  it('web pricing page explicitly discloses mock billing', () => {
    // Canonical marketing is served by apps/web (Next.js)
    const webPricing = path.resolve(process.cwd(), '../../apps/web/src/app/pricing/page.tsx');
    const b = read(webPricing);

    // Web marketing pricing page disclosure
    expect(b).toMatch(/Billing is MVP\/mock in this build\./);

    // Web pricing CTA should be labeled as mock billing.
    expect(b).toMatch(/Upgrade to Pro \(Mock billing\)/);
  });
});
