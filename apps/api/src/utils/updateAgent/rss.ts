// Minimal RSS/Atom parser (no external deps).
// Best-effort: supports common RSS 2.0 (<item>) and Atom (<entry>) shapes.

export type FeedItem = {
  title: string;
  url: string;
  publishedAt: string | null; // ISO
  summary: string;
};

const decodeHtml = (s: string): string =>
  s
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

const stripTags = (s: string): string =>
  s
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const firstMatch = (re: RegExp, s: string): string | null => {
  const m = re.exec(s);
  return m?.[1] ? decodeHtml(m[1]) : null;
};

const parseDateToIso = (raw: string | null): string | null => {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

export function parseFeed(xml: string): FeedItem[] {
  const text = xml || '';
  const items: FeedItem[] = [];

  // RSS items
  const rssItemRe = /<item[\s\S]*?<\/item>/gi;
  const rssItems = text.match(rssItemRe) || [];
  for (const it of rssItems) {
    const title = firstMatch(/<title[^>]*>([\s\S]*?)<\/title>/i, it) || '';
    const link = firstMatch(/<link[^>]*>([\s\S]*?)<\/link>/i, it) || '';
    const guid = firstMatch(/<guid[^>]*>([\s\S]*?)<\/guid>/i, it) || '';
    const url = (link || guid).trim();

    const pubDate = firstMatch(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i, it);
    const publishedAt = parseDateToIso(pubDate);

    const desc =
      firstMatch(/<description[^>]*>([\s\S]*?)<\/description>/i, it) ||
      firstMatch(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i, it) ||
      '';

    const summary = stripTags(decodeHtml(desc)).slice(0, 600);

    if (title && url) {
      items.push({ title, url, publishedAt, summary });
    }
  }

  // Atom entries
  const atomEntryRe = /<entry[\s\S]*?<\/entry>/gi;
  const atomEntries = text.match(atomEntryRe) || [];
  for (const en of atomEntries) {
    const title = firstMatch(/<title[^>]*>([\s\S]*?)<\/title>/i, en) || '';

    // Atom links can be <link href="..." />
    const href = firstMatch(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i, en);
    const linkText = firstMatch(/<link[^>]*>([\s\S]*?)<\/link>/i, en);
    const url = (href || linkText || '').trim();

    const updated =
      firstMatch(/<updated[^>]*>([\s\S]*?)<\/updated>/i, en) ||
      firstMatch(/<published[^>]*>([\s\S]*?)<\/published>/i, en);
    const publishedAt = parseDateToIso(updated);

    const content =
      firstMatch(/<summary[^>]*>([\s\S]*?)<\/summary>/i, en) ||
      firstMatch(/<content[^>]*>([\s\S]*?)<\/content>/i, en) ||
      '';

    const summary = stripTags(decodeHtml(content)).slice(0, 600);

    if (title && url) {
      items.push({ title, url, publishedAt, summary });
    }
  }

  // Stable order: newest first when dates exist; else deterministic by url.
  return items.sort((a, b) => {
    if (a.publishedAt && b.publishedAt) return b.publishedAt.localeCompare(a.publishedAt);
    if (a.publishedAt) return -1;
    if (b.publishedAt) return 1;
    return a.url.localeCompare(b.url);
  });
}
