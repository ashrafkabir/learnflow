import type { OutlineModule } from '../domain-outline.js';

/**
 * Cooking profile: safety/tools → techniques → base recipes → timing/seasoning → planning/variations.
 */
export function cookingRequiredModules(topic: string): OutlineModule[] {
  const t = String(topic || 'Cooking').trim();

  return [
    {
      title: `Kitchen Setup + Safety (${t})`,
      objective: `Set up tools and ingredients and learn the safety/handling practices needed for ${t}.`,
      lessons: [
        {
          title: `Tools and pantry essentials`,
          description: `Pick the minimum tools and core ingredients you need to cook ${t} reliably.`,
        },
        {
          title: `Knife, heat, and food safety basics`,
          description: `Practice safe knife handling, heat control, and storage/temperature rules.`,
        },
      ],
    },
    {
      title: `Core Techniques`,
      objective: `Learn the techniques that unlock most recipes in ${t} (heat control, seasoning, emulsions, timing).`,
      lessons: [
        {
          title: `Heat control + browning`,
          description: `Run a quick drill: sauté vs roast; observe browning and moisture changes.`,
        },
        {
          title: `Seasoning and balance`,
          description: `Practice salting and balancing acid/fat; taste and adjust with a checklist.`,
        },
      ],
    },
    {
      title: `A Repeatable Base Recipe (Worked Recipe)`,
      objective: `Cook one signature dish in ${t} with a step-by-step workflow, timings, and checkpoints.`,
      lessons: [
        {
          title: `Worked recipe: mise en place → cook → finish`,
          description: `Follow a timed workflow with checkpoints; include exact quantities and substitutions.`,
        },
        {
          title: `Sauce/side or supporting element`,
          description: `Add a second component and synchronize timings so the meal finishes together.`,
        },
      ],
    },
    {
      title: `Troubleshooting + Variations`,
      objective: `Fix common issues and adapt ${t} for different constraints (diet, pantry, time).`,
      lessons: [
        {
          title: `Troubleshooting guide`,
          description: `Diagnose 5 common failures and give exact fixes (temperature, timing, hydration, seasoning).`,
        },
        {
          title: `Variations and substitutions`,
          description: `Create 3 variations (quick, vegetarian, budget) and explain what changes in technique.`,
        },
      ],
    },
    {
      title: `Planning and Scaling`,
      objective: `Plan shopping/prep and scale ${t} for multiple servings without quality loss.`,
      lessons: [
        {
          title: `Shopping list and prep plan`,
          description: `Build a shopping list + prep schedule (what can be done ahead, what must be last-minute).`,
        },
        {
          title: `Scaling quantities and timing`,
          description: `Scale the recipe and adjust cookware/heat/timing; include a table for 2/4/8 servings.`,
        },
      ],
    },
  ];
}
