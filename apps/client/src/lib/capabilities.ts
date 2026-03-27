import type { CapabilityId, PlanId, PlanDefinition } from '@learnflow/shared';
import { PLAN_DEFINITIONS } from '@learnflow/shared';

export type CapabilityMatrix = PlanDefinition;

/**
 * Single source of truth for plan copy + feature gating.
 *
 * NOTE: Billing is mock in this build. Keep plan messaging consistent with actual backend support.
 */
export const CAPABILITY_MATRIX: Record<PlanId, CapabilityMatrix> = PLAN_DEFINITIONS;

export function getPlanCopy(plan: PlanId): CapabilityMatrix {
  return CAPABILITY_MATRIX[plan];
}

export type { PlanId, CapabilityId };
