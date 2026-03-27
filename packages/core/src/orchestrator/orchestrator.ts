import { v4 as uuidv4 } from 'uuid';
import type { AgentMessageEnvelope } from '../agents/types.js';
import { AgentRegistry } from '../agents/registry.js';
import type { StudentContextObject } from '../context/student-context.js';
import { DagPlanner, DagTask } from './dag-planner.js';
import { routeIntent } from './intent-router.js';
import { aggregateResponses, AggregatedResponse } from './response-aggregator.js';
import { ORCHESTRATOR_SYSTEM_PROMPT } from './system-prompt.js';

export class Orchestrator {
  private registry: AgentRegistry;
  private planner: DagPlanner;
  readonly systemPrompt: string = ORCHESTRATOR_SYSTEM_PROMPT;

  constructor(registry: AgentRegistry) {
    this.registry = registry;
    this.planner = new DagPlanner();
  }

  /**
   * Process user input: route to agent(s), execute, aggregate response.
   */
  async processMessage(input: string, context: StudentContextObject): Promise<AggregatedResponse> {
    const intent = routeIntent(input, {
      preferredAgents: context.preferredAgents,
      marketplaceAgentManifests: (context as any).marketplaceAgentManifests,
    });

    // Parse lightweight format hints embedded in input (used by REST adapter).
    const fmtMatch = input.match(/\bformat\s*:\s*(cornell|flashcards?|zettelkasten)\b/i);
    const requestedFormat = fmtMatch && fmtMatch[1] ? fmtMatch[1].toLowerCase() : undefined;

    if (!intent) {
      return {
        text: "I'm not sure I understand. Could you tell me more about what you'd like to learn or do? I can help you create courses, take notes, quiz yourself, or explore topics in depth.",
        agentResults: [],
        totalTokensUsed: 0,
        suggestedActions: ['Create a Course', 'Quiz Me', 'Take Notes', 'Explore Topics'],
      };
    }

    const primaryAgent = this.registry.get(intent.agentName);
    if (!primaryAgent) {
      return {
        text: `The ${intent.agentName} capability is temporarily unavailable. Let me try to help you another way.`,
        agentResults: [],
        totalTokensUsed: 0,
        suggestedActions: ['Try Again', 'Ask Something Else'],
      };
    }

    const task: AgentMessageEnvelope['task'] = {
      type: intent.params.type as string,
      params: {
        ...intent.params,
        input,
        ...(intent.agentName === 'notes_agent' && requestedFormat
          ? { format: requestedFormat === 'flashcard' ? 'flashcards' : requestedFormat }
          : {}),
        // If the user explicitly requested a format in text, pass a best-effort format hint.
        // This supports export_agent without requiring a separate UI flow.
        ...(intent.agentName === 'export_agent'
          ? {
              format: /\bmarkdown\b/i.test(input)
                ? 'markdown'
                : /\bscorm\b/i.test(input)
                  ? 'scorm'
                  : /\bjson\b/i.test(input)
                    ? 'json'
                    : /\bpdf\b/i.test(input)
                      ? 'pdf'
                      : undefined,
            }
          : {}),
      },
    };

    // Iter66: minimum viable multi-agent DAG.
    // For high-value intents (course building / research), run a second independent agent in parallel
    // to produce an executive summary. This proves the end-to-end multi-agent orchestration loop.
    const dagTasks: DagTask[] = [];
    const taskAgentById = new Map<string, string>();

    const primaryTaskId = uuidv4();
    dagTasks.push({
      id: primaryTaskId,
      agentName: primaryAgent.name,
      dependsOn: [],
      execute: () => primaryAgent.process(context, task),
    });
    taskAgentById.set(primaryTaskId, primaryAgent.name);

    // Iter67: multi-agent orchestration beyond “primary + summarizer”.
    // For course building, also extend the user mindmap based on the concept decomposition.
    if (intent.agentName === 'course_builder') {
      const mindmapAgent = this.registry.get('mindmap_agent');
      if (mindmapAgent) {
        const mindmapTaskId = uuidv4();
        dagTasks.push({
          id: mindmapTaskId,
          agentName: mindmapAgent.name,
          dependsOn: [primaryTaskId],
          execute: async () => {
            const primaryRes = await primaryAgent.process(context, task);
            const subtopics =
              (primaryRes as any)?.data?.conceptTree?.children
                ?.map((c: any) => c?.label)
                .filter(Boolean) || [];
            return mindmapAgent.process(context, {
              type: 'extend_graph',
              params: { newConcepts: subtopics },
            });
          },
        });
        taskAgentById.set(mindmapTaskId, mindmapAgent.name);
      }
    }

    const maybeAddSummarizer = (): void => {
      const summarizer = this.registry.get('summarizer_agent');
      if (!summarizer) return;

      const summaryTaskId = uuidv4();
      dagTasks.push({
        id: summaryTaskId,
        agentName: summarizer.name,
        dependsOn: [],
        execute: () =>
          summarizer.process(context, {
            type: 'summarize',
            params: {
              input,
              purpose:
                intent.agentName === 'course_builder'
                  ? 'Create an executive summary for the requested course.'
                  : intent.agentName === 'research_agent'
                    ? 'Summarize key findings and recommended next steps.'
                    : 'Provide a concise summary.',
            },
          }),
      });
      taskAgentById.set(summaryTaskId, summarizer.name);
    };

    if (intent.agentName === 'course_builder' || intent.agentName === 'research_agent') {
      maybeAddSummarizer();
    }

    const results = await this.planner.execute(dagTasks);
    const agentResponses = results.map((r) => {
      const agentName = taskAgentById.get(r.taskId) || r.taskId;
      const agentResult = r.result as import('../agents/types.js').AgentResponse | null;

      if (agentResult && !r.error) {
        return {
          ...agentResult,
          task,
        };
      }

      return {
        agentName,
        status: 'error' as const,
        data: r.error ?? 'Unknown error',
        tokensUsed: 0,
        task,
      };
    });

    return aggregateResponses(agentResponses);
  }

  /**
   * Create a properly typed message envelope.
   */
  createEnvelope(
    toAgent: string,
    context: StudentContextObject,
    taskType: string,
    params: Record<string, unknown>,
  ): AgentMessageEnvelope {
    return {
      message_id: uuidv4(),
      from_agent: 'orchestrator',
      to_agent: toAgent,
      context: {
        user_id: context.userId,
        goals: context.goals,
        progress: { quizScores: context.quizScores },
      },
      task: { type: taskType, params },
      response_schema: { type: 'text', fields: ['content'] },
      timeout_ms: 30000,
      priority: 'normal',
    };
  }
}
