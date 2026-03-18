/**
 * Summarizer Agent — condenses long-form content into key takeaways.
 */
import type { AgentInterface, AgentResponse, StudentContextObject } from '@learnflow/core';
export interface Summary {
  originalWordCount: number;
  summaryWordCount: number;
  compressionRatio: number;
  keyPoints: string[];
  summary: string;
}
export declare class SummarizerAgent implements AgentInterface {
  name: string;
  capabilities: string[];
  initialize(): Promise<void>;
  process(
    _context: StudentContextObject,
    task: {
      type: string;
      params: Record<string, unknown>;
    },
  ): Promise<AgentResponse>;
  cleanup(): Promise<void>;
  summarize(content: string, maxWords?: number): Summary;
  private countWords;
}
//# sourceMappingURL=summarizer-agent.d.ts.map
