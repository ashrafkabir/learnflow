// Iter137 P2.12: Single source of truth for client-visible navigation paths.
// NOTE: Keep these in sync with App.tsx routes.

export const ROUTES = {
  dashboard: '/dashboard',
  conversation: '/conversation',
  mindmap: '/mindmap',
  collaborate: '/collaborate',

  marketplaceRoot: '/marketplace',
  marketplaceCourses: '/marketplace/courses',
  marketplaceAgents: '/marketplace/agents',
  marketplaceCreator: '/marketplace/creator',

  notifications: '/notifications',
  settings: '/settings',
} as const;

export type RouteKey = keyof typeof ROUTES;
