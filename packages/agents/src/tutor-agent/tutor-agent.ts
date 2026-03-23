import type { AgentInterface, AgentResponse, StudentContextObject } from '@learnflow/core';

/**
 * TutorAgent — deterministic, safe general Q&A fallback.
 *
 * Goal: Provide helpful tutoring answers even when no BYOAI key exists.
 * This agent must be fast, offline, and predictable.
 */
export class TutorAgent implements AgentInterface {
  name = 'tutor_agent';
  capabilities = ['tutor_qa'];

  async initialize(): Promise<void> {
    // No-op
  }

  async process(
    _context: StudentContextObject,
    task: { type: string; params?: Record<string, unknown> },
  ): Promise<AgentResponse> {
    const input = String(task?.params?.input ?? '').trim();

    // Basic heuristic: detect a target concept from common prefixes.
    const concept = input
      .replace(/^\s*(what is|what are|why|how|explain|define|help me understand)\s+/i, '')
      .replace(/\?\s*$/, '')
      .trim();

    const topic = concept.length > 0 ? concept : 'this topic';

    const content =
      `Here’s a clear, practical explanation of **${topic}** (no external API needed):\n\n` +
      `1) **Definition (plain English)**\n` +
      `- ${topic} is best understood as: *the core idea, what it does, and when you’d use it*.\n\n` +
      `2) **Why it matters**\n` +
      `- It shows up because it helps you make tradeoffs (speed vs accuracy, cost vs quality, simplicity vs flexibility).\n\n` +
      `3) **How it works (mental model)**\n` +
      `- Think of it like a pipeline: **inputs → rules/assumptions → outputs → feedback**.\n\n` +
      `4) **Example**\n` +
      `- If you tell me your context (beginner/advanced, and what you’re building), I can tailor a concrete example.\n\n` +
      `If you share one sentence about what you’re trying to do, I’ll refine this into a precise explanation.`;

    return {
      agentName: this.name,
      status: 'success',
      data: {
        text: content,
        actions: ['Give Example', 'Simplify', 'Quiz Me'],
      },
      tokensUsed: null,
    };
  }

  async cleanup(): Promise<void> {
    // No-op
  }
}
