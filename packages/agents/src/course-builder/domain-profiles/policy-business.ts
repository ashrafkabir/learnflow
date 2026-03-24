import type { OutlineModule } from '../domain-outline.js';

/**
 * Policy/business profile: context → mechanism → options/trade-offs → implementation → measurement.
 */
export function policyBusinessRequiredModules(topic: string): OutlineModule[] {
  const t = String(topic || 'Policy/Business').trim();

  return [
    {
      title: `Problem Framing + Stakeholders (${t})`,
      objective: `Define the decision problem, stakeholders, constraints, and success metrics for ${t}.`,
      lessons: [
        {
          title: `Define the decision and boundary conditions`,
          description: `Write a 1-page framing: what decision is being made, by whom, and under what constraints.`,
        },
        {
          title: `Stakeholders and incentives map`,
          description: `Identify stakeholders and incentives; note where incentives conflict.`,
        },
      ],
    },
    {
      title: `How the Mechanism Works`,
      objective: `Understand the mechanism/design of ${t} with at least one small numerical example.`,
      lessons: [
        {
          title: `Mechanism walkthrough (with numbers)`,
          description: `Walk through the process step-by-step using a concrete example with numbers and a timeline.`,
        },
        {
          title: `Failure modes and unintended consequences`,
          description: `List realistic failure modes and what signals indicate they are happening.`,
        },
      ],
    },
    {
      title: `Options + Trade-offs`,
      objective: `Compare policy/business options with a trade-off table and scenario analysis for ${t}.`,
      lessons: [
        {
          title: `Option set: 3 plausible approaches`,
          description: `Generate 3 approaches and state who benefits/loses under each.`,
        },
        {
          title: `Trade-off table + recommendation`,
          description: `Create a trade-off table (cost, feasibility, risk, equity, timeline) and recommend one option.`,
        },
      ],
    },
    {
      title: `Implementation Playbook`,
      objective: `Translate ${t} into an operational plan: roles, controls, process, and change management.`,
      lessons: [
        {
          title: `Implementation checklist`,
          description: `Build a step-by-step checklist with owners and timing; include governance/controls.`,
        },
        {
          title: `Operating model and communications`,
          description: `Define roles (RACI) and a communications plan for rollout.`,
        },
      ],
    },
    {
      title: `Measurement + Iteration`,
      objective: `Define KPIs, monitoring, and iteration loops to improve outcomes in ${t}.`,
      lessons: [
        {
          title: `KPI set and measurement plan`,
          description: `Define 5–8 KPIs, where data comes from, and how often you'll review them.`,
        },
        {
          title: `Post-mortems and continuous improvement`,
          description: `Run a lightweight retrospective: what to change when the metrics move the wrong way.`,
        },
      ],
    },
  ];
}
