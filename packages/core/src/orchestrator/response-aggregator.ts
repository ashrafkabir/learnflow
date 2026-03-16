import type { AgentResponse } from '../agents/types.js';

export interface AggregatedResponse {
  text: string;
  agentResults: AgentResponse[];
  totalTokensUsed: number;
  suggestedActions: string[];
}

/**
 * Merges multi-agent outputs into a single user-facing response.
 */
export function aggregateResponses(responses: AgentResponse[]): AggregatedResponse {
  const successful = responses.filter((r) => r.status === 'success');
  const failed = responses.filter((r) => r.status === 'error');

  const textParts: string[] = [];
  let totalTokens = 0;
  const actions = new Set<string>();

  for (const resp of successful) {
    if (typeof resp.data === 'string') {
      textParts.push(resp.data);
    } else if (resp.data && typeof resp.data === 'object' && 'text' in resp.data) {
      textParts.push(String((resp.data as { text: string }).text));
    }
    totalTokens += resp.tokensUsed ?? 0;

    // Add contextual actions based on agent type
    if (resp.agentName === 'course_builder') {
      actions.add('Start First Lesson');
      actions.add('View Syllabus');
    }
    if (resp.agentName === 'notes_agent') {
      actions.add('Quiz Me');
      actions.add('Next Lesson');
    }
    if (resp.agentName === 'exam_agent') {
      actions.add('Review Mistakes');
      actions.add('Next Topic');
    }
  }

  if (failed.length > 0) {
    textParts.push('Some features are temporarily unavailable. Let me help you with what I can.');
  }

  return {
    text: textParts.join('\n\n'),
    agentResults: responses,
    totalTokensUsed: totalTokens,
    suggestedActions: Array.from(actions),
  };
}
