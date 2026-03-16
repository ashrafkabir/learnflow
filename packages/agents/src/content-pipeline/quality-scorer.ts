/**
 * Quality Scorer — scores content on 4 dimensions per spec Section 6.1.
 * Authority, recency, relevance, readability — each in [0, 1].
 */

export interface QualityScore {
  authority: number;
  recency: number;
  relevance: number;
  readability: number;
  overall: number;
}

const AUTHORITY_DOMAINS: Record<string, number> = {
  edu: 0.9,
  gov: 0.85,
  org: 0.7,
  'github.com': 0.8,
  'arxiv.org': 0.95,
  'nature.com': 0.95,
  'ieee.org': 0.9,
  'medium.com': 0.5,
  'wikipedia.org': 0.7,
};

/**
 * Score content quality on 4 dimensions.
 */
export function scoreContent(
  text: string,
  domain: string,
  publishDate: Date | null,
  topic: string,
): QualityScore {
  const authority = scoreAuthority(domain);
  const recency = scoreRecency(publishDate);
  const relevance = scoreRelevance(text, topic);
  const readability = scoreReadability(text);

  const overall = (authority + recency + relevance + readability) / 4;

  return { authority, recency, relevance, readability, overall };
}

function scoreAuthority(domain: string): number {
  const lower = domain.toLowerCase();
  for (const [key, score] of Object.entries(AUTHORITY_DOMAINS)) {
    if (lower.includes(key)) return score;
  }
  // Default based on TLD
  if (lower.endsWith('.edu')) return 0.9;
  if (lower.endsWith('.gov')) return 0.85;
  return 0.4;
}

function scoreRecency(publishDate: Date | null): number {
  if (!publishDate) return 0.3;
  const ageMs = Date.now() - publishDate.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays < 30) return 1.0;
  if (ageDays < 90) return 0.9;
  if (ageDays < 180) return 0.7;
  if (ageDays < 365) return 0.5;
  return 0.3;
}

function scoreRelevance(text: string, topic: string): number {
  const words = topic.toLowerCase().split(/\s+/);
  const textLower = text.toLowerCase();
  let matches = 0;
  for (const word of words) {
    if (word.length > 2 && textLower.includes(word)) matches++;
  }
  return Math.min(1.0, matches / Math.max(words.length, 1));
}

function scoreReadability(text: string): number {
  // Simplified Flesch-Kincaid approximation
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  if (words.length === 0 || sentences.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllables = words.reduce((sum, w) => sum + estimateSyllables(w), 0) / words.length;

  // Flesch reading ease: 206.835 - 1.015 * ASL - 84.6 * ASW
  const flesch = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllables;

  // Normalize to [0, 1] — scores above 60 are "easy", mapped to high
  return Math.max(0, Math.min(1, flesch / 100));
}

function estimateSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  const vowelGroups = w.match(/[aeiouy]+/g);
  return Math.max(1, (vowelGroups?.length ?? 1) - (w.endsWith('e') ? 1 : 0));
}
