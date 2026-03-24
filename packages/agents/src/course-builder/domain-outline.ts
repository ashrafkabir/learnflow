export type OutlineDomain =
  | 'quantum_computing'
  | 'programming'
  | 'math'
  | 'policy_business'
  | 'cooking'
  | 'ai_prompting'
  | 'general';

import { extractTopicSubtopics } from './topic-subtopics.js';
import { shapeOutlineWithSubtopics } from './subtopic-outline-shaper.js';

export type OutlineLesson = {
  title: string;
  description: string;
};

export type OutlineModule = {
  title: string;
  objective: string;
  lessons: OutlineLesson[];
};

export type CourseOutline = {
  topic: string;
  domain: OutlineDomain;
  modules: OutlineModule[];
  /** Iter73 P0.2: extracted subtopics used to seed module/lesson specificity. */
  subtopics?: string[];
};

export type LearnerIntent =
  | 'hands_on'
  | 'exam'
  | 'interview'
  | 'build_project'
  | 'overview'
  | 'troubleshooting'
  | 'unknown';

export type PrerequisiteProfile = 'beginner' | 'intermediate' | 'advanced' | 'unknown';

export function topicFingerprint(topic: string): {
  raw: string;
  lower: string;
  words: string[];
  subdomain: string;
  intent: LearnerIntent;
  prerequisite: PrerequisiteProfile;
} {
  const raw = String(topic || '').trim();
  const lower = raw.toLowerCase();
  const words = lower
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  const intent = inferLearnerIntent(lower);
  const prerequisite = inferPrerequisiteProfile(lower);
  const subdomain = inferSubdomain(words);

  return { raw, lower, words, subdomain, intent, prerequisite };
}

function inferLearnerIntent(lower: string): LearnerIntent {
  if (/(hands-on|hands on|tutorial|workshop|step-by-step|step by step)/.test(lower))
    return 'hands_on';
  if (/(exam|quiz|homework|problem set|practice questions)/.test(lower)) return 'exam';
  if (/(interview|coding interview|system design interview)/.test(lower)) return 'interview';
  if (/(build|building|project|ship|deploy)/.test(lower)) return 'build_project';
  if (/(debug|troubleshoot|fix|error|pitfall)/.test(lower)) return 'troubleshooting';
  if (/(overview|introduction|intro|basics|fundamentals)/.test(lower)) return 'overview';
  return 'unknown';
}

function inferPrerequisiteProfile(lower: string): PrerequisiteProfile {
  if (/(beginner|no prior|from scratch|introductory)/.test(lower)) return 'beginner';
  if (/(advanced|expert|research|graduate)/.test(lower)) return 'advanced';
  if (/(intermediate|practical|applied)/.test(lower)) return 'intermediate';
  return 'unknown';
}

function inferSubdomain(words: string[]): string {
  // Try to extract a salient subdomain token (language/framework/cuisine/etc).
  const KNOWN = [
    // programming
    'rust',
    'python',
    'javascript',
    'typescript',
    'java',
    'go',
    'golang',
    'react',
    'nextjs',
    'next',
    'node',
    'docker',
    'kubernetes',
    // math/science
    'linear',
    'algebra',
    'calculus',
    'statistics',
    'probability',
    'eigenvalues',
    'eigenvectors',
    // policy/business
    'carbon',
    'cap-and-trade',
    'cap',
    'trade',
    'esg',
    'finance',
    // cooking
    'italian',
    'pasta',
    'sauce',
    'bake',
    'roast',
    'grill',
    // ai prompting
    'prompt',
    'rag',
    'injection',
  ];

  for (const w of words) {
    const cleaned = w.replace(/[^a-z0-9-]/g, '');
    if (KNOWN.includes(cleaned)) return cleaned;
  }

  // Fallback: first non-stopword token
  const STOP = new Set(['and', 'or', 'the', 'a', 'an', 'to', 'for', 'with', 'in', 'of']);
  const found = words.find((w) => w.length >= 4 && !STOP.has(w));
  return found || '';
}

export function classifyTopicDomain(topic: string): OutlineDomain {
  const fp = topicFingerprint(topic);
  const t = fp.lower;

  // Quantum computing: explicit trigger terms
  if (
    /(^|\b)(quantum)(\b|$)/.test(t) &&
    /(comput|algorithm|qiskit|qubit|circuit|shor|grover)/.test(t)
  ) {
    return 'quantum_computing';
  }
  if (/(^|\b)quantum(\b|$)/.test(t) && /(comput|qiskit|qubit|circuit)/.test(t)) {
    return 'quantum_computing';
  }

  // AI / prompting
  if (
    /(prompt|prompting|llm|large language model|instruction|system prompt|rag|prompt injection)/.test(
      t,
    )
  ) {
    return 'ai_prompting';
  }

  // Programming
  if (
    /(rust|python|javascript|typescript|java\b|c\+\+|golang|go\b|programming|software|api|backend|frontend|kubernetes|docker)/.test(
      t,
    )
  ) {
    return 'programming';
  }

  // Math
  if (
    /(linear algebra|calculus|probability|statistics|derivative|matrix|vector|eigen|proof|theorem)/.test(
      t,
    )
  ) {
    return 'math';
  }

  // Policy / business
  if (
    /(policy|carbon market|carbon markets|cap and trade|cap-and-trade|regulation|compliance|esg|strategy|finance|market|economics)/.test(
      t,
    )
  ) {
    return 'policy_business';
  }

  // Cooking
  if (/(cooking|cook\b|italian|recipe|kitchen|knife|sauce|pasta|bake|roast|grill)/.test(t)) {
    return 'cooking';
  }

  return 'general';
}

function makeGeneralOutline(topic: string): OutlineModule[] {
  const fp = topicFingerprint(topic);
  const t = fp.raw || 'the topic';
  const sd = fp.subdomain ? ` (focus: ${fp.subdomain})` : '';

  // Keep general outline usable, but ban generic module titles without anchoring.
  return [
    {
      title: `Orientation: ${t}${sd}`,
      objective: `Define ${t}, clarify the learner goal, and map the main components you will practice.`,
      lessons: [
        {
          title: `Define ${t} and its moving parts`,
          description: `Build a crisp definition of ${t} and identify the 5–7 parts you will use in practice.`,
        },
      ],
    },
    {
      title: `Foundations for ${t}${sd}`,
      objective: `Learn the foundational concepts and vocabulary you need before applying ${t}.`,
      lessons: [
        {
          title: `Core concepts and vocabulary in ${t}`,
          description: `Learn the essential concepts and how they relate, so you can reason about ${t} clearly.`,
        },
      ],
    },
    {
      title: `Apply ${t}: First Worked Example${sd}`,
      objective: `Apply ${t} in a step-by-step, realistic example that produces an artifact/output.`,
      lessons: [
        {
          title: `Worked example: apply ${t} end-to-end`,
          description: `Walk through a realistic example step-by-step and verify the output/result.`,
        },
      ],
    },
    {
      title: `${t} Pitfalls, Checks, and Next Steps${sd}`,
      objective: `Avoid common mistakes, learn how to self-check, and plan what to learn next in ${t}.`,
      lessons: [
        {
          title: `Common pitfalls and how to self-check`,
          description: `Learn typical errors and build a simple checklist to catch them early.`,
        },
      ],
    },
  ];
}

function makeProgrammingOutline(topic: string): OutlineModule[] {
  const fp = topicFingerprint(topic);
  const t = fp.raw;
  const sd = fp.subdomain ? ` (${fp.subdomain})` : '';
  return [
    {
      title: `Setup and Tooling for ${t}${sd}`,
      objective: `Get a working environment and understand the core toolchain for ${t}.`,
      lessons: [
        {
          title: `Environment setup for ${t}${sd}`,
          description: `Install and verify the tools you need for ${t}.`,
        },
      ],
    },
    {
      title: `Core Syntax & Mental Models: ${t}${sd}`,
      objective: `Learn the foundational syntax and mental models that drive day-to-day work in ${t}.`,
      lessons: [
        {
          title: `Core building blocks in ${t}${sd}`,
          description: `Work through the primitives, data flow, and idioms of ${t}.`,
        },
      ],
    },
    {
      title: `Real I/O in ${t}${sd}`,
      objective: `Connect ${t} to files, APIs, and external systems safely.`,
      lessons: [
        {
          title: `Practical I/O and error handling (${t})`,
          description: `Handle input/output and errors in a realistic workflow.`,
        },
      ],
    },
    {
      title: `Testing and Debugging in ${t}${sd}`,
      objective: `Build confidence in ${t} code through tests and debugging techniques.`,
      lessons: [
        {
          title: `Debugging + tests for ${t}${sd}`,
          description: `Create a tiny test suite and debug a failure.`,
        },
      ],
    },
    {
      title: `Ship a Small ${t}${sd} Project`,
      objective: `Synthesize learning by shipping a small, end-to-end ${t} project.`,
      lessons: [
        {
          title: `Mini-project in ${t}${sd}`,
          description: `Implement a small project that demonstrates the course's key ideas.`,
        },
      ],
    },
  ];
}

function makeMathOutline(topic: string): OutlineModule[] {
  const fp = topicFingerprint(topic);
  const t = fp.raw;
  const sd = fp.subdomain ? ` (focus: ${fp.subdomain})` : '';
  return [
    {
      title: `Definitions and Notation: ${t}${sd}`,
      objective: `Establish precise definitions and notation for ${t}.`,
      lessons: [
        {
          title: `Definitions and notation for ${t}${sd}`,
          description: `Learn the symbols and definitions you'll use throughout ${t}.`,
        },
      ],
    },
    {
      title: `Key Theorems and Intuition in ${t}${sd}`,
      objective: `Understand the main results and the intuition behind them.`,
      lessons: [
        {
          title: `Big ideas in ${t}${sd}`,
          description: `Work through the major theorems/concepts with intuition.`,
        },
      ],
    },
    {
      title: `Worked Problems: ${t}${sd}`,
      objective: `Build skill by solving representative problems in ${t}.`,
      lessons: [
        {
          title: `Step-by-step example in ${t}${sd}`,
          description: `Solve a concrete problem with all steps shown.`,
        },
      ],
    },
    {
      title: `Mistakes + Checking Work in ${t}${sd}`,
      objective: `Avoid typical errors and learn how to check your work in ${t}.`,
      lessons: [
        {
          title: `Error checks for ${t}${sd}`,
          description: `Use sanity checks and common patterns to avoid mistakes.`,
        },
      ],
    },
  ];
}

function makePolicyBusinessOutline(topic: string): OutlineModule[] {
  const fp = topicFingerprint(topic);
  const t = fp.raw;
  const sd = fp.subdomain ? ` (focus: ${fp.subdomain})` : '';
  return [
    {
      title: `Context and Stakeholders: ${t}${sd}`,
      objective: `Understand the background, goals, and key stakeholders for ${t}.`,
      lessons: [
        {
          title: `Frame the problem for ${t}${sd}`,
          description: `Define the problem space, constraints, and who is affected.`,
        },
      ],
    },
    {
      title: `Mechanisms and Incentives: ${t}${sd}`,
      objective: `Learn how the system works and what incentives drive outcomes in ${t}.`,
      lessons: [
        {
          title: `Mechanism walkthrough for ${t}${sd}`,
          description: `Walk through the mechanisms with a simple numerical example.`,
        },
      ],
    },
    {
      title: `Implementation Playbook: ${t}${sd}`,
      objective: `Translate concepts into an actionable plan for applying ${t} in practice.`,
      lessons: [
        {
          title: `Operational steps for ${t}${sd}`,
          description: `Build a checklist and sequence of actions to implement in an organization.`,
        },
      ],
    },
    {
      title: `Risks, Trade-offs, and Measurement: ${t}${sd}`,
      objective: `Evaluate trade-offs and define metrics for success in ${t}.`,
      lessons: [
        {
          title: `Trade-off table for ${t}${sd}`,
          description: `Compare options and define a measurement plan.`,
        },
      ],
    },
  ];
}

function makeCookingOutline(topic: string): OutlineModule[] {
  const fp = topicFingerprint(topic);
  const t = fp.raw;
  const sd = fp.subdomain ? ` (focus: ${fp.subdomain})` : '';
  return [
    {
      title: `Tools, Ingredients, and Safety for ${t}${sd}`,
      objective: `Set up your kitchen, pantry basics, and safety/handling practices for ${t}.`,
      lessons: [
        {
          title: `Kitchen setup for ${t}${sd}`,
          description: `Choose the essential tools and ingredients to start ${t}.`,
        },
      ],
    },
    {
      title: `Core Techniques for ${t}${sd}`,
      objective: `Learn foundational techniques: heat control, salting, emulsions, and timing.`,
      lessons: [
        {
          title: `Technique drills for ${t}${sd}`,
          description: `Practice 2-3 small technique drills that build confidence.`,
        },
      ],
    },
    {
      title: `Worked Recipe: ${t}${sd}`,
      objective: `Build a repeatable process for a signature dish and supporting components.`,
      lessons: [
        {
          title: `Worked recipe for ${t}${sd}`,
          description: `Cook a simple dish with a step-by-step workflow and timing checkpoints.`,
        },
      ],
    },
    {
      title: `Planning, Variations, and Troubleshooting for ${t}${sd}`,
      objective: `Adapt recipes, plan meals, and fix common issues.`,
      lessons: [
        {
          title: `Troubleshooting ${t}${sd}`,
          description: `Fix common issues (texture, seasoning, timing) with specific tactics.`,
        },
      ],
    },
  ];
}

function makeAiPromptingOutline(topic: string): OutlineModule[] {
  const fp = topicFingerprint(topic);
  const t = fp.raw;
  const sd = fp.subdomain ? ` (focus: ${fp.subdomain})` : '';
  return [
    {
      title: `How LLMs Respond to Prompts: ${t}${sd}`,
      objective: `Build a mental model for why prompt changes affect outputs in ${t}.`,
      lessons: [
        {
          title: `Tokens and instructions for ${t}${sd}`,
          description: `Understand the basics: tokens, instructions, and constraints.`,
        },
      ],
    },
    {
      title: `Reusable Prompt Patterns for ${t}${sd}`,
      objective: `Learn reusable patterns (few-shot, rubrics, structured output) for ${t}.`,
      lessons: [
        {
          title: `Reusable templates for ${t}${sd}`,
          description: `Use 3-5 prompt templates and see output differences.`,
        },
      ],
    },
    {
      title: `Evaluation and Iteration for ${t}${sd}`,
      objective: `Measure output quality and iterate prompts systematically.`,
      lessons: [
        {
          title: `Mini-eval for ${t}${sd}`,
          description: `Create a small eval checklist and run prompt variants against it.`,
        },
      ],
    },
    {
      title: `Safety and Prompt Injection in ${t}${sd}`,
      objective: `Defend against prompt injection and unsafe outputs in ${t}.`,
      lessons: [
        {
          title: `Attack + defense for ${t}${sd}`,
          description: `See a simple injection attempt and harden your prompt/tooling.`,
        },
      ],
    },
  ];
}

export function buildCourseOutline(topic: string): CourseOutline {
  const domain = classifyTopicDomain(topic);

  const modules =
    domain === 'quantum_computing'
      ? [] // quantum has its own required structure; handled by profile module.
      : domain === 'programming'
        ? makeProgrammingOutline(topic)
        : domain === 'math'
          ? makeMathOutline(topic)
          : domain === 'policy_business'
            ? makePolicyBusinessOutline(topic)
            : domain === 'cooking'
              ? makeCookingOutline(topic)
              : domain === 'ai_prompting'
                ? makeAiPromptingOutline(topic)
                : makeGeneralOutline(topic);

  // Iter73 P0.2: lightweight topic decomposition concept extraction.
  // When sources are unavailable, use a deterministic topic-only fallback.
  const subtopics = extractTopicSubtopics(topic, undefined, { min: 8, max: 15 });

  // Iter73 P0.2: use extracted subtopics to force non-generic module/lesson phrasing.
  // Requirement: for non-quantum courses, >=60% of module titles should contain a subtopic phrase.
  const shapedModules =
    domain === 'quantum_computing'
      ? modules
      : shapeOutlineWithSubtopics(modules, subtopics, {
          minFractionWithSubtopicInTitle: 0.6,
        });

  return { topic, domain, modules: shapedModules, subtopics };
}
