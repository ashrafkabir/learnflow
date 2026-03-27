/**
 * Intent router — maps user input to agent names.
 * Uses keyword matching (would use LLM in production).
 */

export interface IntentResult {
  agentName: string;
  confidence: number;
  params: Record<string, unknown>;
}

export type MarketplaceAgentManifest = {
  id: string;
  name?: string;
  /** Task types this marketplace agent claims to support (e.g. 'deep_research'). */
  taskTypes: string[];
  /**
   * LearnFlow currently executes built-in agents.
   * Marketplace agents can map to a built-in runtime agent until true dynamic loading exists.
   */
  routesToAgentName: string;
};

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
  context?: {
    preferredAgents?: string[];
    marketplaceAgentManifests?: MarketplaceAgentManifest[];
  },
): IntentResult | null {
  const preferred = new Set((context?.preferredAgents || []).map((s) => String(s)));
  const manifests = Array.isArray(context?.marketplaceAgentManifests)
    ? context!.marketplaceAgentManifests
    : [];

  for (const { patterns, agent, taskType } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (!pattern.test(input)) continue;

      // If the user has activated a marketplace agent that claims this taskType as a capability,
      // prefer it over the built-in default.
      if (preferred.size > 0 && manifests.length > 0) {
        const match = manifests.find(
          (m) =>
            preferred.has(m.id) &&
            Array.isArray(m.taskTypes) &&
            m.taskTypes.includes(taskType) &&
            typeof m.routesToAgentName === 'string' &&
            m.routesToAgentName.length > 0,
        );

        if (match) {
          return {
            agentName: match.routesToAgentName,
            confidence: 0.95,
            params: {
              type: taskType,
              input,
              activatedMarketplaceAgentId: match.id,
              activatedMarketplaceAgentName: match.name || match.id,
              routingReason: `Activated marketplace agent matched taskType=${taskType}`,
            },
          };
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
