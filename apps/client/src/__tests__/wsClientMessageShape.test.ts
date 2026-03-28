import { describe, expect, it } from 'vitest';

import type { WsClientMessage } from '@learnflow/shared';

describe('WS client message contract (type-only)', () => {
  it('allows optional message_id for idempotency/correlation', () => {
    const msg: WsClientMessage = {
      event: 'message',
      data: {
        text: 'hello',
        requestId: 'req-1',
        message_id: 'msg-1',
      },
    };

    expect(msg.data.message_id).toBe('msg-1');
  });
});
