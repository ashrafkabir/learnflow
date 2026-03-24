import type { OutlineModule } from '../domain-outline.js';

/**
 * AI prompting profile: mental model → patterns → evaluation → tool use/RAG → safety.
 */
export function aiPromptingRequiredModules(topic: string): OutlineModule[] {
  const t = String(topic || 'AI Prompting').trim();

  return [
    {
      title: `Mental Model: How LLMs Follow Instructions (${t})`,
      objective: `Understand why prompt changes affect outputs in ${t}: constraints, context, and failure modes.`,
      lessons: [
        {
          title: `Instruction hierarchy + constraints`,
          description: `Learn system vs user vs tool constraints; see how ambiguity creates hallucinations.`,
        },
        {
          title: `A concrete prompt debugging workflow`,
          description: `Iterate on one prompt and document each change with observed output differences.`,
        },
      ],
    },
    {
      title: `Reusable Prompt Patterns`,
      objective: `Use reusable patterns (few-shot, rubrics, structured outputs) tailored to ${t}.`,
      lessons: [
        {
          title: `Structured output + validators`,
          description: `Produce JSON/markdown formats; add a validator checklist and fix failures.`,
        },
        {
          title: `Rubrics and examples`,
          description: `Use a rubric + few-shot examples to drive consistent outputs for a specific task.`,
        },
      ],
    },
    {
      title: `Evaluation + Iteration`,
      objective: `Measure quality and improve prompts systematically for ${t}.`,
      lessons: [
        {
          title: `Mini-eval set`,
          description: `Create 5 test inputs, define pass/fail rules, and compare prompt variants.`,
        },
        {
          title: `Error taxonomy`,
          description: `Classify errors (missing constraints, verbosity, wrong format) and map to fixes.`,
        },
      ],
    },
    {
      title: `Tool Use + RAG (When Needed)`,
      objective: `Decide when tools/search/RAG helps, and how to cite sources in ${t}.`,
      lessons: [
        {
          title: `Tool calling patterns`,
          description: `Design a prompt that calls tools (search, calc) and includes citations.`,
        },
        {
          title: `RAG: chunking + retrieval`,
          description: `Explain chunking/retrieval at a practical level and run a toy example.`,
        },
      ],
    },
    {
      title: `Safety + Prompt Injection`,
      objective: `Defend against prompt injection and unsafe outputs relevant to ${t}.`,
      lessons: [
        {
          title: `Attack and defense walkthrough`,
          description: `Show a simple injection attempt and harden the prompt/tool boundaries.`,
        },
        {
          title: `Red-teaming checklist`,
          description: `Create a checklist of adversarial tests you can rerun over time.`,
        },
      ],
    },
  ];
}
