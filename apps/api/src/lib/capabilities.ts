export type PlanId = 'free' | 'pro';

export type CapabilityId =
  | 'courses.unlimited'
  | 'agents.priority'
  | 'keys.managed'
  | 'update_agent'
  | 'analytics.advanced'
  | 'support.priority'
  | 'marketplace.publish'
  | 'export.data';

export type CapabilityMatrix = {
  plan: PlanId;
  enabled: Record<CapabilityId, boolean>;
};

/**
 * Server-side source of truth for feature gating.
 * Keep this aligned with apps/client/src/lib/capabilities.ts.
 */
export const CAPABILITY_MATRIX: Record<PlanId, CapabilityMatrix> = {
  free: {
    plan: 'free',
    enabled: {
      'courses.unlimited': false,
      'agents.priority': false,
      'keys.managed': false,
      update_agent: false,
      'analytics.advanced': false,
      'support.priority': false,
      'marketplace.publish': true,
      'export.data': false,
    },
  },
  pro: {
    plan: 'pro',
    enabled: {
      'courses.unlimited': true,
      'agents.priority': true,
      'keys.managed': false,
      update_agent: true,
      'analytics.advanced': true,
      'support.priority': true,
      'marketplace.publish': true,
      'export.data': true,
    },
  },
};
