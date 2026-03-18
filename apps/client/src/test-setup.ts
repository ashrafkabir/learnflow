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
  // @ts-expect-error - global polyfill
  globalThis.IntersectionObserver = IntersectionObserver;
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

// ── "No silent crashes" test gate ──────────────────────────────────────────
// The suite used to pass while React logged real runtime crashes (ErrorBoundary,
// uncaught errors, etc.). Fail fast on console.error / console.warn unless an
// allowlisted message is expected noise.
const originalError = console.error.bind(console);
const originalWarn = console.warn.bind(console);

const ALLOWLIST = [
  // app-branded logs
  '[LearnFlow]',
  // fetch/url noise when some tests intentionally use relative URLs
  'Invalid URL',
];

function shouldAllowConsoleMessage(args: unknown[]): boolean {
  const first = args[0];
  const msg = typeof first === 'string' ? first : first instanceof Error ? first.message : '';

  return ALLOWLIST.some((s) => msg.includes(s));
}

console.error = (...args: unknown[]) => {
  if (shouldAllowConsoleMessage(args)) return;
  originalError(...args);
  throw new Error(`console.error during test: ${String(args[0])}`);
};

console.warn = (...args: unknown[]) => {
  if (shouldAllowConsoleMessage(args)) return;
  originalWarn(...args);
  throw new Error(`console.warn during test: ${String(args[0])}`);
};

// Fail tests on unhandled promise rejections.
process.on('unhandledRejection', (reason) => {
  throw reason instanceof Error ? reason : new Error(`UnhandledRejection: ${String(reason)}`);
});
