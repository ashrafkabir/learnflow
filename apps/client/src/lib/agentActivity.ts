export type AgentActivityKind = 'routing' | 'agent_call' | 'pipeline_stage' | null | undefined;

export function kindLabel(kind: AgentActivityKind): string {
  switch (kind) {
    case 'routing':
      return 'Routing';
    case 'agent_call':
      return 'Agent call';
    case 'pipeline_stage':
      return 'Pipeline';
    default:
      return 'Agent';
  }
}

export function formatDurationMs(durationMs: unknown): string {
  const ms = typeof durationMs === 'number' ? durationMs : Number(durationMs);
  if (!Number.isFinite(ms) || ms < 0) return '';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function elapsedMsSince(
  startedAtIso: string | null | undefined,
  nowMs: number = Date.now(),
): number {
  if (!startedAtIso) return 0;
  const t = Date.parse(startedAtIso);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, nowMs - t);
}
