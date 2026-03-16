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

export class SummarizerAgent implements AgentInterface {
  name = 'summarizer_agent';
  capabilities = ['summarize', 'condense', 'key_takeaways'];

  async initialize(): Promise<void> {}

  async process(
    _context: StudentContextObject,
    task: { type: string; params: Record<string, unknown> },
  ): Promise<AgentResponse> {
    const content = (task.params.content as string) || (task.params.input as string) || '';
    const maxWords = (task.params.maxWords as number) || 500;

    const summary = this.summarize(content, maxWords);

    return {
      agentName: this.name,
      status: 'success',
      data: {
        text: summary.summary,
        summary,
      },
      tokensUsed: 100,
    };
  }

  async cleanup(): Promise<void> {}

  summarize(content: string, maxWords: number = 500): Summary {
    const words = content.split(/\s+/).filter(Boolean);
    const originalWordCount = words.length;

    // Extract key sentences (first sentence of each paragraph + important ones)
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const keyPoints: string[] = [];
    const summaryParts: string[] = [];

    // Take first few sentences and sentences with key indicator words
    const indicators = ['important', 'key', 'main', 'significant', 'crucial', 'essential'];

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      const isImportant = indicators.some((i) => trimmed.toLowerCase().includes(i));

      if (summaryParts.length < 3 || isImportant) {
        if (this.countWords(summaryParts.join('. ')) < maxWords) {
          summaryParts.push(trimmed);
          if (trimmed.length > 20) {
            keyPoints.push(trimmed.slice(0, 100) + (trimmed.length > 100 ? '...' : ''));
          }
        }
      }
    }

    // Ensure we don't exceed maxWords
    let summaryText = summaryParts.join('. ');
    const summaryWords = summaryText.split(/\s+/);
    if (summaryWords.length > maxWords) {
      summaryText = summaryWords.slice(0, maxWords).join(' ') + '...';
    }

    const summaryWordCount = this.countWords(summaryText);

    return {
      originalWordCount,
      summaryWordCount,
      compressionRatio: originalWordCount > 0 ? summaryWordCount / originalWordCount : 0,
      keyPoints: keyPoints.slice(0, 5),
      summary: summaryText,
    };
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
  }
}
