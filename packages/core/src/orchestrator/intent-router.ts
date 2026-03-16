/**
 * Intent router — maps user input to agent names.
 * Uses keyword matching (would use LLM in production).
 */

export interface IntentResult {
  agentName: string;
  confidence: number;
  params: Record<string, unknown>;
}

const INTENT_PATTERNS: Array<{
  patterns: RegExp[];
  agent: string;
  taskType: string;
}> = [
  {
    patterns: [/\b(learn|study|course|teach me|want to learn|build.*course)\b/i],
    agent: 'course_builder',
    taskType: 'build_course',
  },
  {
    patterns: [/\b(quiz|test|exam|assess|check my knowledge)\b/i],
    agent: 'exam_agent',
    taskType: 'generate_quiz',
  },
  {
    patterns: [/\b(notes?|take notes|summarize this|note-?taking)\b/i],
    agent: 'notes_agent',
    taskType: 'take_notes',
  },
  {
    patterns: [/\b(research|go deeper|latest research|papers?|primary sources?)\b/i],
    agent: 'research_agent',
    taskType: 'deep_research',
  },
  {
    patterns: [/\b(collaborate|study group|study partner|peer|work together)\b/i],
    agent: 'collaboration_agent',
    taskType: 'find_peers',
  },
  {
    patterns: [/\b(summarize|summary|condense|tldr|key takeaways)\b/i],
    agent: 'summarizer_agent',
    taskType: 'summarize',
  },
  {
    patterns: [/\b(mindmap|knowledge graph|show.*map|see.*progress|visualize)\b/i],
    agent: 'mindmap_agent',
    taskType: 'update_mindmap',
  },
  {
    patterns: [/\b(export|download|offline|pdf)\b/i],
    agent: 'export_agent',
    taskType: 'export',
  },
];

export function routeIntent(input: string): IntentResult | null {
  for (const { patterns, agent, taskType } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        return {
          agentName: agent,
          confidence: 0.9,
          params: { type: taskType, input },
        };
      }
    }
  }
  return null;
}
