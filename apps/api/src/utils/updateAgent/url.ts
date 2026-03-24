export function normalizeUrl(input: string): string {
  const trimmed = String(input || '').trim();
  if (!trimmed) throw new Error('URL required');

  // Add scheme if user pasted naked domain.
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const u = new URL(withScheme);

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Invalid URL protocol');
  }

  // Normalize host + strip fragments.
  u.hash = '';
  u.hostname = u.hostname.toLowerCase();

  // Strip common tracking params.
  const drop = new Set([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'utm_id',
    'gclid',
    'fbclid',
  ]);
  for (const k of Array.from(u.searchParams.keys())) {
    if (drop.has(k.toLowerCase())) u.searchParams.delete(k);
  }

  // Strip trailing slash on path (except root).
  if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/g, '');

  return u.toString();
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
