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

export class ResearchAgent implements AgentInterface {
  name = 'research_agent';
  capabilities = ['deep_research', 'find_papers', 'synthesize'];
  private api?: SemanticScholarApi;

  constructor(api?: SemanticScholarApi) {
    this.api = api;
  }

  async initialize(): Promise<void> {}

  async process(
    _context: StudentContextObject,
    task: { type: string; params: Record<string, unknown> },
  ): Promise<AgentResponse> {
    const topic = (task.params.topic as string) || (task.params.input as string) || 'general';

    let papers: Paper[] = [];
    if (this.api) {
      papers = await this.api.search(topic);
    } else {
      // Mock papers for testing
      papers = this.getMockPapers(topic);
    }

    const summary = this.synthesize(topic, papers);

    return {
      agentName: this.name,
      status: 'success',
      data: {
        text: summary.synthesis,
        summary,
        papers,
      },
      tokensUsed: 200,
    };
  }

  async cleanup(): Promise<void> {}

  private getMockPapers(topic: string): Paper[] {
    return [
      {
        title: `Introduction to ${topic}`,
        authors: ['A. Smith', 'B. Jones'],
        abstract: `This paper provides an overview of ${topic} and its applications.`,
        url: `https://arxiv.org/abs/${Date.now()}`,
        year: 2024,
        citations: 50,
      },
      {
        title: `Advanced ${topic} Techniques`,
        authors: ['C. Wilson'],
        abstract: `We present novel techniques for ${topic} with improved performance.`,
        url: `https://arxiv.org/abs/${Date.now() + 1}`,
        year: 2025,
        citations: 25,
      },
    ];
  }

  synthesize(topic: string, papers: Paper[]): ResearchSummary {
    const keyFindings = papers.map(
      (p) => `${p.authors[0]} (${p.year}): ${p.abstract.slice(0, 100)}...`,
    );

    const synthesis =
      `Research on "${topic}" spans ${papers.length} papers. ` +
      `Key contributions include work by ${papers.map((p) => p.authors[0]).join(', ')}. ` +
      `The most cited work has ${Math.max(...papers.map((p) => p.citations))} citations.`;

    return {
      topic,
      papers,
      synthesis,
      keyFindings,
    };
  }
}
