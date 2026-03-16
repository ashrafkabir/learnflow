/**
 * Deduplication — near-duplicate detection via simplified SimHash.
 */

/**
 * Generate a simple hash fingerprint from text using word n-grams.
 */
function simpleFingerprint(text: string, ngramSize: number = 3): Set<string> {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const ngrams = new Set<string>();
  for (let i = 0; i <= words.length - ngramSize; i++) {
    ngrams.add(words.slice(i, i + ngramSize).join(' '));
  }
  return ngrams;
}

/**
 * Compute Jaccard similarity between two texts.
 */
export function similarity(textA: string, textB: string): number {
  const fpA = simpleFingerprint(textA);
  const fpB = simpleFingerprint(textB);

  if (fpA.size === 0 && fpB.size === 0) return 1.0;
  if (fpA.size === 0 || fpB.size === 0) return 0.0;

  let intersection = 0;
  for (const ng of fpA) {
    if (fpB.has(ng)) intersection++;
  }

  const union = fpA.size + fpB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Check if two texts are near-duplicates (similarity > threshold).
 */
export function isDuplicate(textA: string, textB: string, threshold: number = 0.7): boolean {
  return similarity(textA, textB) > threshold;
}
