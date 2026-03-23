import type { WsServerEvent } from './ws';

// Type-level contract test: ensures the shared WS `error` event matches the server envelope.
// If this file stops compiling, the contract drifted.

const evt: WsServerEvent = {
  event: 'error',
  data: {
    error: { code: 'invalid_json', message: 'Invalid JSON' },
    requestId: 'req-123',
    message_id: 'msg-1',
  },
};

void evt;
