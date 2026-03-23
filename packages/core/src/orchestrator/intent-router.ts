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
    // Milestone / accomplishment messages should get a warm, encouraging response.
    // Example: "I just completed my first module on quantum computing!"
    patterns: [
      /\b(i\s*)?(just\s*)?(completed|finished|passed|wrapped up|done with)\b/i,
      /\b(first\s+module|first\s+lesson|first\s+course|milestone|achievement|achieved)\b/i,
      /\b(i\s*got\s*through|i\s*made\s*it\s*through)\b/i,
    ],
    agent: 'summarizer_agent',
    taskType: 'celebrate_milestone',
  },
  {
    patterns: [/\b(mindmap|knowledge graph|show.*map|see.*progress|visualize)\b/i],
    agent: 'mindmap_agent',
    taskType: 'update_mindmap',
  },
  {
    patterns: [/\b(export|download|offline|pdf|markdown|scorm)\b/i],
    agent: 'export_agent',
    taskType: 'export',
  },
  {
    // General Q&A / tutoring — keep this last so it doesn't steal more specific intents.
    patterns: [/^\s*(what is|what are|why|how|explain|define|help me understand)\b/i, /\?\s*$/],
    agent: 'tutor_agent',
    taskType: 'tutor_qa',
  },
];

export function routeIntent(
  input: string,
  context?: { preferredAgents?: string[] },
): IntentResult | null {
  const preferred = new Set((context?.preferredAgents || []).map((s) => String(s)));

  for (const { patterns, agent, taskType } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (!pattern.test(input)) continue;

      // If the user has activated a marketplace agent that claims this taskType as a capability,
      // prefer it over the built-in default.
      if (preferred.size > 0) {
        for (const id of preferred) {
          // marketplace ids like "ma-2" (from API seed) can be mapped to agent names.
          // This mapping is intentionally simple for MVP semantics.
          if (taskType === 'deep_research' && id === 'ma-2') {
            return {
              agentName: 'research_agent',
              confidence: 0.95,
              params: { type: taskType, input, activatedMarketplaceAgentId: id },
            };
          }
          if (taskType === 'build_course' && id === 'ma-1') {
            return {
              agentName: 'course_builder',
              confidence: 0.95,
              params: { type: taskType, input, activatedMarketplaceAgentId: id },
            };
          }
        }
      }

      return {
        agentName: agent,
        confidence: 0.9,
        params: { type: taskType, input },
      };
    }
  }
  return null;
}
