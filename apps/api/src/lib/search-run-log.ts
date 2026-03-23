/**
 * Iter68/69: structured logs describing what searches were run.
 * Used for UI display + debugging + spec compliance.
 */

export function makeStage1Log(params: {
  templatesUsed: string[];
  queries: string[];
  perQueryLimit: number;
  enabledSources: Record<string, boolean>;
}): any {
  return {
    id: `sr1-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    stage: 'stage1',
    createdAt: new Date().toISOString(),
    templatesUsed: params.templatesUsed,
    queries: params.queries,
    perQueryLimit: params.perQueryLimit,
    enabledSources: params.enabledSources,
  };
}

export function makeStage2Log(params: {
  templatesUsed: string[];
  queries: string[];
  perQueryLimit: number;
  enabledSources: Record<string, boolean>;
  moduleTitle: string;
  lessonTitle: string;
}): any {
  return {
    id: `sr2-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    stage: 'stage2',
    createdAt: new Date().toISOString(),
    moduleTitle: params.moduleTitle,
    lessonTitle: params.lessonTitle,
    templatesUsed: params.templatesUsed,
    queries: params.queries,
    perQueryLimit: params.perQueryLimit,
    enabledSources: params.enabledSources,
  };
}

export function makeLayerLog(params: {
  layerId: string;
  layerLabel: string;
  templatesUsed: string[];
  queries: string[];
  perQueryLimit: number;
  enabledSources: Record<string, boolean>;
  resultsCount?: number;
}): any {
  return {
    id: `srl-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    stage: 'phase1',
    createdAt: new Date().toISOString(),
    layerId: params.layerId,
    layerLabel: params.layerLabel,
    templatesUsed: params.templatesUsed,
    queries: params.queries,
    perQueryLimit: params.perQueryLimit,
    enabledSources: params.enabledSources,
    resultsCount: params.resultsCount ?? null,
  };
}
