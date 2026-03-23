/**
 * Image Search Provider (license-safe, no paid key)
 *
 * Uses the Wikimedia Commons MediaWiki API to find images with
 * reuse-friendly licenses (CC / Public Domain).
 *
 * NOTE: This is best-effort. We explicitly return license metadata and the
 * source page for attribution.
 */

export type LicenseSafeImageCandidate = {
  url: string; // direct image URL
  sourcePageUrl: string; // Wikimedia Commons file page
  title: string;
  author?: string;
  license: string;
  licenseUrl?: string;
  attributionRequired?: boolean;
  accessedAt: string; // ISO string
};

function isTestMode(): boolean {
  return process.env.NODE_ENV === 'test' || !!process.env.VITEST;
}

function safeStr(x: any): string {
  return String(x ?? '').trim();
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').trim();
}

function isReuseFriendlyLicense(licenseShort: string, usageTerms: string): boolean {
  const l = (licenseShort || '').toLowerCase();
  const u = (usageTerms || '').toLowerCase();

  if (l.includes('fair use') || u.includes('fair use')) return false;
  if (l.includes('non-free') || u.includes('non-free')) return false;

  // Common reuse-friendly buckets
  if (l.includes('cc0') || l.includes('public domain')) return true;
  if (l.includes('cc by') || l.includes('cc-by')) return true;
  if (l.includes('cc by-sa') || l.includes('cc-by-sa')) return true;

  return false;
}

/**
 * Search Wikimedia Commons for license-safe image candidates.
 */
export async function searchWikimediaCommonsImages(
  query: string,
  opts?: { limit?: number },
): Promise<LicenseSafeImageCandidate[]> {
  if (isTestMode()) return [];

  const limit = Math.max(1, Math.min(8, opts?.limit ?? 4));
  const accessedAt = new Date().toISOString();

  // generator=search returns matching pages; we ask for imageinfo with extmetadata.
  // https://www.mediawiki.org/wiki/API:Imageinfo
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  url.searchParams.set('generator', 'search');
  // Bias toward file pages.
  url.searchParams.set('gsrsearch', `${query} filetype:bitmap`);
  url.searchParams.set('gsrlimit', String(limit));
  url.searchParams.set('gsrnamespace', '6'); // File:
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url|extmetadata');
  url.searchParams.set('iiurlwidth', '1024');
  url.searchParams.set(
    'iiextmetadatafilter',
    'LicenseShortName|LicenseUrl|UsageTerms|Artist|ImageDescription|AttributionRequired',
  );

  const resp = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'LearnFlow (educational prototype; license-safe images)',
      Accept: 'application/json',
    },
  });
  if (!resp.ok) return [];

  const data: any = await resp.json();
  const pages = data?.query?.pages ? (Object.values(data.query.pages) as any[]) : [];
  const out: LicenseSafeImageCandidate[] = [];

  for (const p of pages) {
    const ii = p?.imageinfo?.[0];
    const ext = ii?.extmetadata || {};
    const licenseShort = safeStr(ext?.LicenseShortName?.value);
    const licenseUrl = safeStr(ext?.LicenseUrl?.value);
    const usageTerms = safeStr(ext?.UsageTerms?.value);
    if (!isReuseFriendlyLicense(licenseShort, usageTerms)) continue;

    const directUrl = safeStr(ii?.thumburl || ii?.url);
    const title = safeStr(p?.title || 'Wikimedia Commons image');
    const author = stripHtml(safeStr(ext?.Artist?.value));
    const attributionRequired = safeStr(ext?.AttributionRequired?.value).toLowerCase() === 'true';

    // Construct a human-readable commons file page URL
    const sourcePageUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(
      title.replace(/\s+/g, '_'),
    )}`;
    if (!directUrl) continue;

    out.push({
      url: directUrl,
      sourcePageUrl,
      title,
      author: author || undefined,
      license: licenseShort || 'unknown',
      licenseUrl: licenseUrl || undefined,
      attributionRequired,
      accessedAt,
    });
  }

  return out.slice(0, limit);
}
