import { inferSourceType } from './sourceCards.js';

export type CredibilityLabel = 'High' | 'Medium' | 'Low' | 'Unknown';

export type SourceCredibility = {
  credibilityScore: number; // 0..1
  credibilityLabel: CredibilityLabel;
  whyCredible: string;
  sourceType?: 'docs' | 'blog' | 'paper' | 'forum';
};

function safeDomain(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const h = new URL(url).hostname;
    return h.replace(/^www\./i, '') || undefined;
  } catch {
    return undefined;
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function labelFor(score: number): CredibilityLabel {
  if (score >= 0.8) return 'High';
  if (score >= 0.55) return 'Medium';
  if (score > 0) return 'Low';
  return 'Unknown';
}

/**
 * Best-effort, heuristic credibility scoring.
 * This is NOT a truth claim; it is a UX aid.
 */
export function scoreSourceCredibility(input: {
  url: string;
  domain?: string;
  publication?: string;
  sourceType?: 'docs' | 'blog' | 'paper' | 'forum';
}): SourceCredibility {
  const domain = (input.domain || safeDomain(input.url) || '').toLowerCase();
  const sourceType = input.sourceType || inferSourceType(input.url, domain);

  // Baseline by type (docs/papers tend to be more stable; forums lowest).
  let score =
    sourceType === 'paper'
      ? 0.78
      : sourceType === 'docs'
        ? 0.72
        : sourceType === 'blog'
          ? 0.55
          : sourceType === 'forum'
            ? 0.4
            : 0.5;

  // Domain-based boosts.
  const boost = (d: string, amt: number) => {
    if (domain === d || domain.endsWith(`.${d}`) || domain.includes(d)) score += amt;
  };

  boost('wikipedia.org', 0.12);
  boost('arxiv.org', 0.12);
  boost('doi.org', 0.12);
  boost('acm.org', 0.1);
  boost('ieee.org', 0.1);
  boost('kubernetes.io', 0.1);
  boost('react.dev', 0.1);
  boost('developer.mozilla.org', 0.1);
  boost('docs.microsoft.com', 0.08);
  boost('learn.microsoft.com', 0.08);

  // Academic/official-ish TLDs (weak signal).
  if (domain.endsWith('.edu') || domain.endsWith('.ac.uk')) score += 0.08;
  if (domain.endsWith('.gov')) score += 0.08;

  // Penalties for overtly user-generated domains.
  boost('reddit.com', -0.08);
  boost('stackoverflow.com', -0.05);
  if (domain.endsWith('wordpress.com') || domain.endsWith('blogspot.com')) score -= 0.06;

  score = clamp01(score);

  const credibilityLabel = labelFor(score);
  const whyCredible =
    credibilityLabel === 'High'
      ? `High credibility (heuristic): likely authoritative ${sourceType === 'paper' ? 'research' : 'documentation'} source (${domain || 'web'}).`
      : credibilityLabel === 'Medium'
        ? `Medium credibility (heuristic): useful for learning, but verify key claims against primary docs (${domain || 'web'}).`
        : credibilityLabel === 'Low'
          ? `Low credibility (heuristic): often opinionated or anecdotal; corroborate with docs or papers (${domain || 'web'}).`
          : `Credibility unknown (heuristic): insufficient metadata to score (${domain || 'web'}).`;

  return { credibilityScore: score, credibilityLabel, whyCredible, sourceType };
}
