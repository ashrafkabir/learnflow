import { describe, it, expect } from 'vitest';
import type { WsServerEvent } from '../types/ws';

describe('WS contract: mindmap.suggestions', () => {
  it('type accepts mindmap.suggestions payload', () => {
    const evt: WsServerEvent = {
      event: 'mindmap.suggestions',
      data: {
        courseId: 'c-1',
        suggestions: [{ id: 's-1', label: 'Topic', reason: 'Because', parentLessonId: 'l-1' }],
      },
    };

    expect(evt.event).toBe('mindmap.suggestions');
    expect(evt.data.suggestions[0].id).toBe('s-1');
  });
});
