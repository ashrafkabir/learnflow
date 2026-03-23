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
function addDefaultActionChips(actions: Set<string>, opts: { isLessonLike: boolean }): void {
  // Always ensure a minimum set of useful actions.
  // Keep labels stable because the client and tests may depend on them.
  const base = ['Take Notes', 'Quiz Me', 'Next Lesson'];
  for (const a of base) actions.add(a);

  if (opts.isLessonLike) actions.add('Go Deeper');

  // Bound to 4 chips max; the API will slice further if needed.
  // Order is controlled later, after we pick from the set.
}

function orderAndLimitActions(actions: Set<string>, max = 4): string[] {
  const priority = [
    'Next Lesson',
    'Take Notes',
    'Quiz Me',
    'Go Deeper',
    'See Sources',
    'View Syllabus',
    'Start First Lesson',
    'Review Mistakes',
    'Next Topic',
    'Ask Something Else',
    'Try Again',
  ];

  const arr = Array.from(actions);
  arr.sort((a, b) => {
    const ia = priority.indexOf(a);
    const ib = priority.indexOf(b);
    const ra = ia === -1 ? 999 : ia;
    const rb = ib === -1 ? 999 : ib;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });

  return arr.slice(0, max);
}

export function aggregateResponses(responses: AgentResponse[]): AggregatedResponse {
  const successful = responses.filter((r) => r.status === 'success');
  const failed = responses.filter((r) => r.status === 'error');

  const textParts: string[] = [];
  let totalTokens = 0;
  const actions = new Set<string>();

  // Heuristic: treat responses that look like lessons as lesson-like.
  // This influences whether we suggest "Go Deeper".
  let isLessonLike = false;

  for (const resp of successful) {
    if (typeof resp.data === 'string') {
      textParts.push(resp.data);
      if (resp.data.toLowerCase().includes('lesson')) isLessonLike = true;
    } else if (resp.data && typeof resp.data === 'object' && 'text' in resp.data) {
      const t = String((resp.data as { text: string }).text);
      textParts.push(t);
      if (t.toLowerCase().includes('lesson')) isLessonLike = true;
    }
    totalTokens += resp.tokensUsed ?? 0;

    // Add contextual actions based on agent type
    if (resp.agentName === 'course_builder') {
      actions.add('Start First Lesson');
      actions.add('View Syllabus');
      actions.add('Next Lesson');
    }
    if (resp.agentName === 'notes_agent') {
      actions.add('Quiz Me');
      actions.add('Next Lesson');
    }
    if (resp.agentName === 'exam_agent') {
      actions.add('Review Mistakes');
      actions.add('Next Topic');
      actions.add('Next Lesson');
    }
    if (resp.agentName === 'research_agent') {
      actions.add('See Sources');
      actions.add('Go Deeper');
    }
  }

  // Enforce 3–4 contextual action chips even when agents provide none.
  addDefaultActionChips(actions, { isLessonLike });

  if (failed.length > 0) {
    textParts.push('Some features are temporarily unavailable. Let me help you with what I can.');
    actions.add('Try Again');
  }

  return {
    text: textParts.join('\n\n'),
    agentResults: responses,
    totalTokensUsed: totalTokens,
    suggestedActions: orderAndLimitActions(actions, 4),
  };
}
