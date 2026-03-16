import type { StudentContextObject } from '../context/student-context.js';

/**
 * Agent message envelope — spec Section 4.3
 */
export interface AgentMessageEnvelope {
  message_id: string;
  from_agent: string;
  to_agent: string;
  context: {
    user_id: string;
    goals: string[];
    progress: Record<string, unknown>;
  };
  task: {
    type: string;
    params: Record<string, unknown>;
  };
  response_schema: {
    type: string;
    fields: string[];
  };
  timeout_ms: number;
  priority: 'low' | 'normal' | 'high';
}

/**
 * Agent interface — all agents implement this (spec Section 7.2)
 */
export interface AgentInterface {
  name: string;
  capabilities: string[];
  initialize(): Promise<void>;
  process(
    context: StudentContextObject,
    task: AgentMessageEnvelope['task'],
  ): Promise<AgentResponse>;
  cleanup(): Promise<void>;
}

export interface AgentResponse {
  agentName: string;
  status: 'success' | 'error';
  data: unknown;
  tokensUsed?: number;
}
