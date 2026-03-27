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
  label: string;
  priceMonthlyUsd: number;
  priceAnnualUsd: number;
  tagline: string;
  features: string[];
  missing?: string[];
  enabled: Record<CapabilityId, boolean>;
  notes?: string[];
};

/**
 * Single source of truth for plan copy + feature gating.
 * Keep this aligned with what the backend *actually* supports in this deployment.
 */
export const CAPABILITY_MATRIX: Record<PlanId, CapabilityMatrix> = {
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
      'Managed API keys (when available)',
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
      'Managed API keys (when available)',
      'Update Agent',
      'Cornell notes & flashcards',
      'Knowledge mindmap',
      'Advanced analytics',
      'Priority support',
      'Data export',
    ],
    missing: undefined,
    enabled: {
      'courses.unlimited': true,
      'agents.priority': true,
      'keys.managed': true,
      update_agent: true,
      'analytics.advanced': true,
      'support.priority': true,
      'marketplace.publish': true,
      'export.data': true,
    },
    notes: ['Managed keys availability depends on this deployment.'],
  },
};

export function getPlanCopy(plan: PlanId): CapabilityMatrix {
  return CAPABILITY_MATRIX[plan];
}
