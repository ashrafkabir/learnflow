import type { NextRequest } from 'next/server';

/**
 * Iter132 P1: Fix dev HEAD / instability.
 *
 * In dev (and sometimes in preview), Next can surface transient 500s for HEAD requests
 * even when GET succeeds. We treat HEAD / as a lightweight health probe and ensure it
 * returns 200 consistently.
 */
export function middleware(req: NextRequest) {
  if (req.method === 'HEAD' && req.nextUrl.pathname === '/') {
    return new Response(null, { status: 200 });
  }

  return undefined;
}

export const config = {
  matcher: ['/:path*'],
};
