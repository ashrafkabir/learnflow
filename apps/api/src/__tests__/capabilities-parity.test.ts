import { describe, expect, it } from 'vitest';

import { CAPABILITY_MATRIX as SERVER_MATRIX } from '../lib/capabilities.js';
import { PLAN_DEFINITIONS } from '@learnflow/shared';

describe('Capabilities parity (server vs shared plan definitions)', () => {
  it('keeps server enabled flags aligned with shared plan definitions', () => {
    expect(SERVER_MATRIX.free.enabled).toEqual(PLAN_DEFINITIONS.free.enabled);
    expect(SERVER_MATRIX.pro.enabled).toEqual(PLAN_DEFINITIONS.pro.enabled);
  });
});
