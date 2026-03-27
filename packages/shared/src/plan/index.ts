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

export type PlanCopy = {
  plan: PlanId;
  label: string;
  priceMonthlyUsd: number;
  priceAnnualUsd: number;
  tagline: string;
  features: string[];
  missing?: string[];
  notes?: string[];
};

export type CapabilityMatrix = {
  plan: PlanId;
  enabled: Record<CapabilityId, boolean>;
};

export type PlanDefinition = PlanCopy & CapabilityMatrix;

/**
 * Shared, build-time plan definitions.
 *
 * IMPORTANT:
 * - This repo intentionally runs billing in mock mode.
 * - `keys.managed` is not available in this build; keep copy explicit.
 */
export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free: {
    plan: 'free',
    label: 'Free',
    priceMonthlyUsd: 0,
    priceAnnualUsd: 0,
    tagline: 'Perfect for getting started',
    features: [
      '3 courses',
      'Basic AI agents',
      'Bring your own API keys',
      'Cornell notes & flashcards',
      'Knowledge mindmap',
      'Community support',
    ],
    missing: [
      'Priority AI agents',
      'Managed API keys (not available in this build)',
      'Update Agent',
      'Advanced analytics',
      'Priority support',
      'Data export',
    ],
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
    notes: ['You can upgrade to Pro anytime.'],
  },
  pro: {
    plan: 'pro',
    label: 'Pro',
    priceMonthlyUsd: 19,
    priceAnnualUsd: 15,
    tagline: 'For serious learners',
    features: [
      'Unlimited courses',
      'Priority AI agents',
      'Update Agent',
      'Cornell notes & flashcards',
      'Knowledge mindmap',
      'Advanced analytics',
      'Priority support',
      'Data export',
    ],
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
    notes: ['Managed API keys are not available in this build (coming soon).'],
  },
};

export function getPlan(plan: PlanId): PlanDefinition {
  return PLAN_DEFINITIONS[plan];
}
