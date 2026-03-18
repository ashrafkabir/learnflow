import '@testing-library/jest-dom';

// Mock fetch globally to prevent TypeError: Invalid URL errors in test environment
// when components make relative API calls like /api/v1/...
const mockFetch = async (_url: string | URL | Request, _init?: RequestInit): Promise<Response> => {
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

globalThis.fetch = mockFetch as typeof globalThis.fetch;

// Suppress console.error for fetch-related noise in tests
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('[LearnFlow]') || msg.includes('Invalid URL')) return;
  originalError(...args);
};
