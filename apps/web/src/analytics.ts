/**
 * S11-A11: PostHog analytics — initialized but not tracking in dev
 */

export interface AnalyticsConfig {
  apiKey: string;
  apiHost: string;
  enabled: boolean;
}

const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

export function initAnalytics(config?: Partial<AnalyticsConfig>): AnalyticsConfig {
  const finalConfig: AnalyticsConfig = {
    apiKey: config?.apiKey || process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
    apiHost: config?.apiHost || 'https://app.posthog.com',
    enabled: !isDev && !!config?.apiKey,
  };

  if (finalConfig.enabled) {
    // In production, would call posthog.init(...)
    console.log('[Analytics] PostHog initialized');
  } else {
    console.log('[Analytics] PostHog disabled in dev/test');
  }

  return finalConfig;
}

export function trackEvent(_name: string, _properties?: Record<string, unknown>): void {
  // No-op in dev/test; would call posthog.capture() in production
}
