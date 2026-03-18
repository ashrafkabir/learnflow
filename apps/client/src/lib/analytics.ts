/**
 * Analytics abstraction layer — PostHog-ready.
 * Install posthog-js and set VITE_POSTHOG_TOKEN to enable real tracking.
 */

interface AnalyticsProvider {
  capture(event: string, props?: Record<string, unknown>): void;
  identify(id: string, traits?: Record<string, unknown>): void;
}

let provider: AnalyticsProvider | null = null;

export const analytics = {
  /** Register an external provider (e.g. posthog instance). */
  setProvider(p: AnalyticsProvider) {
    provider = p;
  },

  track(event: string, props?: Record<string, unknown>) {
    if (provider?.capture) provider.capture(event, props);
    if (import.meta.env.DEV) console.debug('[analytics]', event, props);
  },

  identify(userId: string, traits?: Record<string, unknown>) {
    if (provider?.identify) provider.identify(userId, traits);
  },

  page(name: string) {
    analytics.track('$pageview', { page: name });
  },
};
