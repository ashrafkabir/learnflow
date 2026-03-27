import type { MarketplaceAgentManifest } from '@learnflow/core';

/**
 * Minimal manifest resolver for marketplace agents.
 *
 * LearnFlow does not yet dynamically load third-party runtime agents.
 * For MVP semantics, marketplace agents can declare taskTypes and map to built-in agents.
 */

function getStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .map((x) => String(x))
    .map((x) => x.trim())
    .filter(Boolean);
}

export function resolveMarketplaceAgentManifest(params: {
  agentId: string;
  /** Raw manifest stored with agent submissions (if any) */
  manifest?: unknown;
}): MarketplaceAgentManifest | null {
  const { agentId, manifest } = params;

  // Seeded marketplace agents from the public marketplace router.
  if (agentId === 'ma-1') {
    return {
      id: 'ma-1',
      name: 'Code Tutor',
      taskTypes: ['tutor_qa'],
      routesToAgentName: 'tutor_agent',
    };
  }
  if (agentId === 'ma-2') {
    return {
      id: 'ma-2',
      name: 'Research Pro',
      taskTypes: ['deep_research'],
      routesToAgentName: 'research_agent',
    };
  }

  // DB-submitted agents (as-*) can optionally declare:
  // - taskTypes: string[]
  // - routesToAgentName: string (built-in agent name)
  // - name: string
  const m: any = manifest && typeof manifest === 'object' ? (manifest as any) : {};
  const taskTypes = getStringArray(m.taskTypes || m.capabilities || m.task_types);

  const routesToAgentName =
    typeof m.routesToAgentName === 'string'
      ? m.routesToAgentName
      : typeof m.routes_to_agent === 'string'
        ? m.routes_to_agent
        : undefined;

  if (!taskTypes.length || !routesToAgentName) return null;

  return {
    id: agentId,
    name: typeof m.name === 'string' ? m.name : undefined,
    taskTypes,
    routesToAgentName,
  };
}
