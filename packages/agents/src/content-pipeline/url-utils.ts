/**
 * URL utilities shared across content pipeline modules.
 *
 * NOTE: Keep this file provider-neutral. It is used by OpenAI-only MVP paths.
 */

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}
