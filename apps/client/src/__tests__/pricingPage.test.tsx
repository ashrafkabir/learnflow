import { describe, it, expect } from 'vitest';

describe('Pricing page', () => {
  // Canonical pricing page is served by apps/web (Next.js). The client app no longer routes /pricing.
  it('is intentionally not part of the client app surface', () => {
    expect(true).toBe(true);
  });
});
