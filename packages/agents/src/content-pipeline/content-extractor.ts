/**
 * Content Extractor — returns clean text from HTML pages.
 */

/**
 * Strip HTML tags and return clean text content.
 */
export function extractText(html: string): string {
  // Remove script and style elements
  let clean = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '');
  clean = clean.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  clean = clean.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  clean = clean.replace(/<header[\s\S]*?<\/header>/gi, '');

  // Remove all remaining HTML tags
  clean = clean.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  clean = clean.replace(/&amp;/g, '&');
  clean = clean.replace(/&lt;/g, '<');
  clean = clean.replace(/&gt;/g, '>');
  clean = clean.replace(/&quot;/g, '"');
  clean = clean.replace(/&#39;/g, "'");
  clean = clean.replace(/&nbsp;/g, ' ');

  // Normalize whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  return clean;
}
