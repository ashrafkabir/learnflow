import {
  PLAN_DEFINITIONS,
  type CapabilityId,
  type PlanDefinition,
  type PlanId,
} from '@learnflow/shared';

export type CapabilityMatrix = {
  plan: PlanId;
  enabled: Record<CapabilityId, boolean>;
};

/**
 * Server-side source of truth for feature gating.
 *
 * In this build, billing is mock, but feature gating must be consistent across server + client.
 * Keep the shared plan definitions in @learnflow/shared/src/plan as the single source of truth.
 */
export const CAPABILITY_MATRIX: Record<PlanId, CapabilityMatrix> = {
  free: { plan: 'free', enabled: PLAN_DEFINITIONS.free.enabled },
  pro: { plan: 'pro', enabled: PLAN_DEFINITIONS.pro.enabled },
};

export type { PlanId, CapabilityId, PlanDefinition };
