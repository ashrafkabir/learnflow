import { describe, expect, it } from 'vitest';

import { toUserError } from '../lib/toUserError.js';

describe('toUserError', () => {
  it('uses Error.message when provided', () => {
    const e = new Error('Nope');
    expect(toUserError(e, 'fallback').message).toBe('Nope');
  });

  it('stringifies unknown objects into a safe fallback and extracts requestId/message from ErrorEnvelope shape', () => {
    const err = { requestId: 'req-123', error: { code: 'bad', message: 'Bad thing' } };
    const u = toUserError(err as any, 'fallback');
    expect(u.message).toBe('Bad thing');
    expect(u.requestId).toBe('req-123');
  });

  it('falls back when err is a non-Error and has no message', () => {
    const u = toUserError({ foo: 'bar' } as any, 'fallback msg');
    expect(u.message).toBe('fallback msg');
  });
});
