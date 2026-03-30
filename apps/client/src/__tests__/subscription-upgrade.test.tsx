import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import PricingPage from '../../../../apps/web/src/app/pricing/page';

describe('Subscription upgrade UX (web pricing page)', () => {
  it('has an Upgrade CTA present and labeled mock billing', async () => {
    render(<PricingPage />);

    const upgrade = await screen.findByRole('link', { name: /upgrade to pro/i });
    expect(upgrade).toHaveTextContent(/mock billing/i);
  });
});
