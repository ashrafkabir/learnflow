/**
 * Research Agent — finds papers and synthesizes findings.
 */
import type { AgentInterface, AgentResponse, StudentContextObject } from '@learnflow/core';
export interface Paper {
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  year: number;
  citations: number;
}
export interface ResearchSummary {
  topic: string;
  papers: Paper[];
  synthesis: string;
  keyFindings: string[];
}
export interface SemanticScholarApi {
  search(query: string): Promise<Paper[]>;
}
export declare class ResearchAgent implements AgentInterface {
  name: string;
  capabilities: string[];
  private api?;
  constructor(api?: SemanticScholarApi);
  initialize(): Promise<void>;
  process(
    _context: StudentContextObject,
    task: {
      type: string;
      params: Record<string, unknown>;
    },
  ): Promise<AgentResponse>;
  cleanup(): Promise<void>;
  private getMockPapers;
  synthesize(topic: string, papers: Paper[]): ResearchSummary;
}
//# sourceMappingURL=research-agent.d.ts.map
