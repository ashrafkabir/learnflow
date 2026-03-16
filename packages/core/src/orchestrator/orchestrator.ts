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
    const intent = routeIntent(input);

    if (!intent) {
      return {
        text: "I'm not sure I understand. Could you tell me more about what you'd like to learn or do? I can help you create courses, take notes, quiz yourself, or explore topics in depth.",
        agentResults: [],
        totalTokensUsed: 0,
        suggestedActions: ['Create a Course', 'Quiz Me', 'Take Notes', 'Explore Topics'],
      };
    }

    const agent = this.registry.get(intent.agentName);
    if (!agent) {
      return {
        text: `The ${intent.agentName} capability is temporarily unavailable. Let me try to help you another way.`,
        agentResults: [],
        totalTokensUsed: 0,
        suggestedActions: ['Try Again', 'Ask Something Else'],
      };
    }

    const task: AgentMessageEnvelope['task'] = {
      type: intent.params.type as string,
      params: { ...intent.params, input },
    };

    const dagTask: DagTask = {
      id: uuidv4(),
      agentName: agent.name,
      dependsOn: [],
      execute: () => agent.process(context, task),
    };

    const results = await this.planner.execute([dagTask]);
    const agentResponses = results.map((r) => {
      // r.result is the AgentResponse from the agent's process() method
      const agentResult = r.result as import('../agents/types.js').AgentResponse | null;
      if (agentResult && !r.error) {
        return agentResult;
      }
      return {
        agentName: agent.name,
        status: 'error' as const,
        data: r.error ?? 'Unknown error',
        tokensUsed: 0,
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
