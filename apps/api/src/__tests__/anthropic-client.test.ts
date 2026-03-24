import { describe, it, expect, vi } from 'vitest';

const fetchMock = vi.fn();
(global as any).fetch = fetchMock;

import { AnthropicClient } from '../llm/anthropic.js';

describe('Iter85: Anthropic client', () => {
  it('calls /v1/messages with correct headers', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-sonnet-latest',
        content: [{ type: 'text', text: 'hi' }],
      }),
      text: async () => '',
    });

    const client = new AnthropicClient('sk-ant-test');
    await client.messagesCreate({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hello' }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.headers['x-api-key']).toBe('sk-ant-test');
    expect(init.headers['anthropic-version']).toBe('2023-06-01');
  });
});
