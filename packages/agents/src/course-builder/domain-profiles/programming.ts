import type { OutlineModule } from '../domain-outline.js';

/**
 * Programming profile: a prerequisite-aware module skeleton that forces specificity.
 *
 * NOTE: This is used by the API course generator (apps/api) to produce a topic-appropriate
 * outline before lesson generation.
 */
export function programmingRequiredModules(topic: string): OutlineModule[] {
  const t = String(topic || 'Programming').trim();

  return [
    {
      title: `Problem Setup + Toolchain (${t})`,
      objective: `Install/verify the toolchain and define the exact problem you'll solve with ${t}.`,
      lessons: [
        {
          title: `Define the build target (inputs/outputs)`,
          description: `Write a crisp spec: what goes in, what comes out, constraints, and success criteria in ${t}.`,
        },
        {
          title: `Set up your environment and run a hello-world`,
          description: `Install the runtime/compiler, create a project, and run the smallest working program for ${t}.`,
        },
      ],
    },
    {
      title: `Data Model + Control Flow`,
      objective: `Learn the data types, collections, and control flow patterns you'll need for real tasks in ${t}.`,
      lessons: [
        {
          title: `Represent the data (types, structs/classes)`,
          description: `Design a minimal data model for your target problem (not generic examples).`,
        },
        {
          title: `Control flow and error handling`,
          description: `Handle branches/loops and implement error handling for realistic failure cases.`,
        },
      ],
    },
    {
      title: `I/O: Files, Network, and APIs`,
      objective: `Connect ${t} code to the outside world (files and HTTP) safely and predictably.`,
      lessons: [
        {
          title: `Read/write real input`,
          description: `Parse an input file or stdin into your data model; validate and surface errors clearly.`,
        },
        {
          title: `Call an external API (with retries + timeouts)`,
          description: `Make a real HTTP request, handle timeouts, and parse a JSON response into typed objects.`,
        },
      ],
    },
    {
      title: `Testing + Debugging + Performance`,
      objective: `Build confidence via tests, learn debugging workflow, and measure basic performance for ${t}.`,
      lessons: [
        {
          title: `Write a small test suite`,
          description: `Add unit tests around parsing and business logic; include at least one failing test and fix it.`,
        },
        {
          title: `Debug a real bug end-to-end`,
          description: `Use logs/breakpoints to find and fix a bug; add a regression test.`,
        },
      ],
    },
    {
      title: `Ship a Tiny Project`,
      objective: `Deliver a small, complete artifact in ${t}: runnable, documented, and verifiable.`,
      lessons: [
        {
          title: `Mini-project: implement + run`,
          description: `Build the end-to-end solution that matches the spec from module 1 (include how to run + expected output).`,
        },
        {
          title: `Packaging and next steps`,
          description: `Add a README, basic CI checks, and outline extensions you could build next.`,
        },
      ],
    },
  ];
}
