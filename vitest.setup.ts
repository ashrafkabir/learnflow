/* Global Vitest setup
   Goal (Iter 27): make the suite fail on real runtime crashes / ErrorBoundary logs.

   Note: This file must be safe for BOTH jsdom and node test environments.
*/

// ── Polyfills (jsdom only) ────────────────────────────────────────────────
// Framer Motion uses IntersectionObserver; jsdom doesn't provide it.
if (
  typeof (globalThis as any).window !== 'undefined' &&
  typeof (globalThis as any).IntersectionObserver === 'undefined'
) {
  class IntersectionObserver {
    constructor(_cb: any, _options?: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  (globalThis as any).IntersectionObserver = IntersectionObserver;
}

// ── No-silent-crashes gate ────────────────────────────────────────────────
const originalError = console.error.bind(console);
const originalWarn = console.warn.bind(console);

const ALLOWLIST_SUBSTRINGS: string[] = [
  '[LearnFlow]',
  'Invalid URL',

  // Known noisy logs from non-browser agent tests (should be cleaned up later)
  '[WebSearch]',
  'resp.json is not a function',

  // React Router v6 future flag warnings (not actionable for this iteration)
  'React Router Future Flag Warning',
];

function msgFromArgs(args: unknown[]): string {
  const first = args[0];
  if (typeof first === 'string') return first;
  if (first instanceof Error) return first.message;
  try {
    return JSON.stringify(first);
  } catch {
    return String(first);
  }
}

function shouldAllow(args: unknown[]): boolean {
  const msg = msgFromArgs(args);
  return ALLOWLIST_SUBSTRINGS.some((s) => msg.includes(s));
}

console.error = (...args: unknown[]) => {
  if (shouldAllow(args)) return;
  originalError(...args);
  throw new Error(`console.error during test: ${msgFromArgs(args)}`);
};

console.warn = (...args: unknown[]) => {
  if (shouldAllow(args)) return;
  originalWarn(...args);
  throw new Error(`console.warn during test: ${msgFromArgs(args)}`);
};

process.on('unhandledRejection', (reason) => {
  throw reason instanceof Error ? reason : new Error(`UnhandledRejection: ${String(reason)}`);
});
