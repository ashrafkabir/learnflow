import '@testing-library/jest-dom';

// ── Global polyfills (jsdom) ────────────────────────────────────────────────
// Framer Motion / viewport-based hooks rely on IntersectionObserver in the browser.
// jsdom doesn't provide it, so we polyfill a minimal, no-op implementation.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin = '';
    readonly thresholds = [0];
    constructor(_cb: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  globalThis.IntersectionObserver = IntersectionObserver as any;
}

// ── Network mocks ───────────────────────────────────────────────────────────
// Mock fetch globally to prevent TypeError: Invalid URL errors in test environment
// when components make relative API calls like /api/v1/...
const mockFetch = async (_url: string | URL | Request, _init?: RequestInit): Promise<Response> => {
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

globalThis.fetch = mockFetch as typeof globalThis.fetch;

// Note: console error/warn gating is centralized in the root `vitest.setup.ts`
// to avoid double-wrapping and confusing stack traces. Keep this file focused on
// jsdom polyfills + lightweight network mocks.
