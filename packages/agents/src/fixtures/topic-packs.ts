export interface TopicPackSource {
  url: string;
  title: string;
  author?: string;
  content: string;
  publishedAt?: string;
}

export interface TopicPack {
  domain: 'programming' | 'math' | 'policy_business' | 'cooking' | 'ai_prompting';
  topic: string;
  sources: TopicPackSource[];
}

// Iter73 P2.12: Offline deterministic topic packs.
// These are small, domain-specific corpora used to make subtopic extraction and outline
// shaping tests deterministic without network calls.

export const TOPIC_PACKS: TopicPack[] = [
  {
    domain: 'programming',
    topic: 'Rust ownership and borrowing',
    sources: [
      {
        url: 'https://example.local/rust/ownership',
        title: 'Rust Ownership Basics (offline fixture)',
        author: 'LearnFlow',
        content:
          'Ownership, borrowing, lifetimes, references, mutable borrow rules, move semantics, copy types, the borrow checker. Common patterns: &T vs &mut T, slices, iterators.',
        publishedAt: '2024-01-01',
      },
      {
        url: 'https://example.local/rust/lifetimes',
        title: 'Lifetimes and the Borrow Checker (offline fixture)',
        author: 'LearnFlow',
        content:
          'Lifetime annotations, elision rules, static lifetime, structs with references, trait bounds, explicit lifetime parameters, compiler errors E0502 E0515.',
        publishedAt: '2024-01-01',
      },
    ],
  },
  {
    domain: 'math',
    topic: 'Gradient descent optimization',
    sources: [
      {
        url: 'https://example.local/math/gradients',
        title: 'Gradients and Updates (offline fixture)',
        author: 'LearnFlow',
        content:
          'Objective function, learning rate, partial derivatives, update rule, convergence, step size, local minima, convexity, momentum, adaptive methods.',
      },
    ],
  },
  {
    domain: 'policy_business',
    topic: 'Cap-and-trade carbon markets',
    sources: [
      {
        url: 'https://example.local/policy/cap-trade',
        title: 'Cap-and-Trade Mechanics (offline fixture)',
        author: 'LearnFlow',
        content:
          'Emissions cap, allowances, auctions, secondary markets, compliance periods, offsets, MRV, price volatility, leakage, equity impacts, marginal abatement cost.',
      },
    ],
  },
  {
    domain: 'cooking',
    topic: 'Italian pasta and sauces',
    sources: [
      {
        url: 'https://example.local/cooking/pasta',
        title: 'Pasta Shapes and Sauce Pairing (offline fixture)',
        author: 'LearnFlow',
        content:
          'Al dente, starch, emulsification, salt, boiling, timing, sauté, reduction, garlic, olive oil, tomatoes, ragù, cacio e pepe, carbonara, pesto, cheese.',
      },
    ],
  },
  {
    domain: 'ai_prompting',
    topic: 'Prompt engineering for customer support',
    sources: [
      {
        url: 'https://example.local/ai/prompting',
        title: 'Support Prompt Patterns (offline fixture)',
        author: 'LearnFlow',
        content:
          'System instructions, safety policies, tone, escalation, clarification questions, structured outputs, tool use, refusal behavior, examples, few-shot prompts.',
      },
    ],
  },
];
