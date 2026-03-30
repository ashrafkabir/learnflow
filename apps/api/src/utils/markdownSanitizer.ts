// Minimal markdown sanitizers used to enforce artifact formatting contracts.
// Keep deterministic + unit-tested.

/**
 * If an LLM returns markdown wrapped in a fenced code block (``` or ```markdown),
 * unwrap it. Otherwise return the original text.
 */
export function unwrapFencedMarkdown(input: string): string {
  const raw = String(input || '');
  const trimmed = raw.trim();
  if (!trimmed.startsWith('```')) return raw;

  // Match: ```lang?\n ... \n```
  const m = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n```\s*$/);
  if (!m) return raw;

  return String(m[1] || '').trim() + '\n';
}
