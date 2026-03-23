export type OutlineDomain =
  | 'quantum_computing'
  | 'programming'
  | 'math'
  | 'policy_business'
  | 'cooking'
  | 'ai_prompting'
  | 'general';

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
};

export function topicFingerprint(topic: string): {
  raw: string;
  lower: string;
  words: string[];
} {
  const raw = String(topic || '').trim();
  const lower = raw.toLowerCase();
  const words = lower
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  return { raw, lower, words };
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
  const t = String(topic || 'the topic').trim();
  return [
    {
      title: `${t}: Orientation and Goals`,
      objective: `Understand what ${t} is, why it matters, and how this course is structured.`,
      lessons: [
        {
          title: `What is ${t}?`,
          description: `Build a clear definition and map the main moving parts of ${t}.`,
        },
      ],
    },
    {
      title: `${t}: Core Concepts`,
      objective: `Learn the essential concepts and vocabulary needed to reason about ${t}.`,
      lessons: [
        {
          title: `Key concepts in ${t}`,
          description: `Identify the core ideas, terms, and mental models used in ${t}.`,
        },
      ],
    },
    {
      title: `${t}: Practice and Application`,
      objective: `Apply the core concepts of ${t} through a concrete worked example.`,
      lessons: [
        {
          title: `Worked example: applying ${t}`,
          description: `Walk through a realistic example step-by-step to apply what you've learned.`,
        },
      ],
    },
    {
      title: `${t}: Common Pitfalls and Next Steps`,
      objective: `Avoid common mistakes and plan what to learn next in ${t}.`,
      lessons: [
        {
          title: `Mistakes to avoid in ${t}`,
          description: `Learn the typical errors beginners make and how to avoid them.`,
        },
      ],
    },
  ];
}

function makeProgrammingOutline(topic: string): OutlineModule[] {
  const t = String(topic).trim();
  return [
    {
      title: `Setup and Tooling for ${t}`,
      objective: `Get a working environment and understand the core toolchain for ${t}.`,
      lessons: [
        {
          title: `Environment setup`,
          description: `Install and verify the tools you need for ${t}.`,
        },
      ],
    },
    {
      title: `Core Syntax & Mental Models (${t})`,
      objective: `Learn the foundational syntax and mental models that drive day-to-day work in ${t}.`,
      lessons: [
        {
          title: `Core building blocks`,
          description: `Work through the primitives, data flow, and idioms of ${t}.`,
        },
      ],
    },
    {
      title: `Working with Real Inputs/Outputs`,
      objective: `Connect ${t} to files, APIs, and external systems safely.`,
      lessons: [
        {
          title: `Practical I/O`,
          description: `Handle input/output and errors in a realistic workflow.`,
        },
      ],
    },
    {
      title: `Testing, Debugging, and Quality`,
      objective: `Build confidence in ${t} code through tests and debugging techniques.`,
      lessons: [
        {
          title: `Debugging + tests`,
          description: `Create a tiny test suite and debug a failure.`,
        },
      ],
    },
    {
      title: `Building a Small Project`,
      objective: `Synthesize learning by shipping a small, end-to-end ${t} project.`,
      lessons: [
        {
          title: `Mini-project`,
          description: `Implement a small project that demonstrates the course's key ideas.`,
        },
      ],
    },
  ];
}

function makeMathOutline(topic: string): OutlineModule[] {
  const t = String(topic).trim();
  return [
    {
      title: `Core Definitions in ${t}`,
      objective: `Establish precise definitions and notation for ${t}.`,
      lessons: [
        {
          title: `Definitions and notation`,
          description: `Learn the symbols and definitions you'll use throughout ${t}.`,
        },
      ],
    },
    {
      title: `${t}: Key Theorems and Intuition`,
      objective: `Understand the main results and the intuition behind them.`,
      lessons: [
        {
          title: `Big ideas`,
          description: `Work through the major theorems/concepts with intuition.`,
        },
      ],
    },
    {
      title: `Worked Problems`,
      objective: `Build skill by solving representative problems in ${t}.`,
      lessons: [
        {
          title: `Step-by-step example`,
          description: `Solve a concrete problem with all steps shown.`,
        },
      ],
    },
    {
      title: `Common Mistakes + Exam Tactics`,
      objective: `Avoid typical errors and learn how to check your work in ${t}.`,
      lessons: [
        {
          title: `Error checks`,
          description: `Use sanity checks and common patterns to avoid mistakes.`,
        },
      ],
    },
  ];
}

function makePolicyBusinessOutline(topic: string): OutlineModule[] {
  const t = String(topic).trim();
  return [
    {
      title: `Context and Stakeholders (${t})`,
      objective: `Understand the background, goals, and key stakeholders for ${t}.`,
      lessons: [
        { title: `Problem framing`, description: `Define the problem space and who is affected.` },
      ],
    },
    {
      title: `Mechanisms and Incentives`,
      objective: `Learn how the system works and what incentives drive outcomes in ${t}.`,
      lessons: [
        {
          title: `How it works`,
          description: `Walk through the mechanisms with a simple numerical example.`,
        },
      ],
    },
    {
      title: `Implementation Playbook`,
      objective: `Translate concepts into an actionable plan for applying ${t} in practice.`,
      lessons: [
        {
          title: `Operational steps`,
          description: `Build a checklist and sequence of actions to implement in an organization.`,
        },
      ],
    },
    {
      title: `Risks, Trade-offs, and Measurement`,
      objective: `Evaluate trade-offs and define metrics for success in ${t}.`,
      lessons: [
        { title: `Trade-off table`, description: `Compare options and define a measurement plan.` },
      ],
    },
  ];
}

function makeCookingOutline(topic: string): OutlineModule[] {
  const t = String(topic).trim();
  return [
    {
      title: `${t}: Pantry, Tools, and Safety`,
      objective: `Set up your kitchen, pantry basics, and safety/handling practices for ${t}.`,
      lessons: [
        {
          title: `Kitchen setup`,
          description: `Choose the essential tools and ingredients to start ${t}.`,
        },
      ],
    },
    {
      title: `Core Techniques (Italian style)`,
      objective: `Learn foundational techniques: heat control, salting, emulsions, and timing.`,
      lessons: [
        {
          title: `Technique drills`,
          description: `Practice 2-3 small technique drills that build confidence.`,
        },
      ],
    },
    {
      title: `Signature Bases: Pasta, Sauce, and Seasoning`,
      objective: `Build a repeatable process for pasta and a few core sauces.`,
      lessons: [
        {
          title: `Worked recipe: pasta + sauce`,
          description: `Cook a simple pasta dish with a step-by-step sauce workflow.`,
        },
      ],
    },
    {
      title: `Planning, Variations, and Troubleshooting`,
      objective: `Adapt recipes, plan meals, and fix common issues.`,
      lessons: [
        {
          title: `Troubleshooting`,
          description: `Fix watery sauce, overcooked pasta, and bland flavor with specific tactics.`,
        },
      ],
    },
  ];
}

function makeAiPromptingOutline(topic: string): OutlineModule[] {
  const t = String(topic).trim();
  return [
    {
      title: `How LLMs Respond to Prompts`,
      objective: `Build a mental model for why prompt changes affect outputs in ${t}.`,
      lessons: [
        {
          title: `Tokens and instructions`,
          description: `Understand the basics: tokens, instructions, and constraints.`,
        },
      ],
    },
    {
      title: `Prompt Patterns You Can Reuse`,
      objective: `Learn reusable patterns (few-shot, rubrics, structured output) for ${t}.`,
      lessons: [
        {
          title: `Reusable templates`,
          description: `Use 3-5 prompt templates and see output differences.`,
        },
      ],
    },
    {
      title: `Evaluation and Iteration`,
      objective: `Measure output quality and iterate prompts systematically.`,
      lessons: [
        {
          title: `Mini-eval`,
          description: `Create a small eval checklist and run prompt variants against it.`,
        },
      ],
    },
    {
      title: `Safety and Prompt Injection`,
      objective: `Defend against prompt injection and unsafe outputs in ${t}.`,
      lessons: [
        {
          title: `Attack + defense`,
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

  return { topic, domain, modules };
}
