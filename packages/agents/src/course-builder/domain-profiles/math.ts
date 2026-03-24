import type { OutlineModule } from '../domain-outline.js';

/**
 * Math profile: definitions → techniques → worked problems → proof/intuition → application.
 */
export function mathRequiredModules(topic: string): OutlineModule[] {
  const t = String(topic || 'Math').trim();

  return [
    {
      title: `Definitions, Notation, and Basic Objects (${t})`,
      objective: `Establish precise definitions and notation so you can read and write statements in ${t}.`,
      lessons: [
        {
          title: `Key definitions and symbols`,
          description: `Define the core objects (with 2–3 tiny numeric examples using real symbols).`,
        },
        {
          title: `A first sanity-check computation`,
          description: `Compute a small example end-to-end to ground the definitions.`,
        },
      ],
    },
    {
      title: `Core Techniques and Theorems`,
      objective: `Learn the main techniques/theorems you will use repeatedly in ${t}.`,
      lessons: [
        {
          title: `Technique 1: the workhorse method`,
          description: `Apply the primary method on a representative case (show every step).`,
        },
        {
          title: `Technique 2: an alternate approach`,
          description: `Solve the same type of problem with a different method and compare.`,
        },
      ],
    },
    {
      title: `Worked Problems (Step-by-Step)`,
      objective: `Build competence by solving representative problems in ${t} with full computations.`,
      lessons: [
        {
          title: `Worked example: compute it`,
          description: `Solve a concrete numerical problem and check the answer two ways.`,
        },
        {
          title: `Practice set + solutions`,
          description: `Do 3 short problems and provide full solutions (not just answers).`,
        },
      ],
    },
    {
      title: `Proof Ideas and Common Pitfalls`,
      objective: `Learn what a proof is trying to show in ${t} and avoid typical mistakes.`,
      lessons: [
        {
          title: `Proof sketch: why the theorem works`,
          description: `Write a proof sketch with the key lemmas; connect each step to intuition.`,
        },
        {
          title: `Error checks and counterexamples`,
          description: `Use counterexamples/sanity checks to detect common errors.`,
        },
      ],
    },
    {
      title: `Applications + Next Steps`,
      objective: `Connect ${t} to at least one real application and set a plan for further study.`,
      lessons: [
        {
          title: `Application: plug into a real context`,
          description: `Use ${t} to solve a small applied task (e.g., a data/physics/engineering scenario).`,
        },
        {
          title: `What to learn next`,
          description: `Recommend follow-on topics and what practice looks like.`,
        },
      ],
    },
  ];
}
