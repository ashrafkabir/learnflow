export type SectionQuotaMetrics = {
  totalWords: number;
  bySection: Record<string, number>;
  coreConceptsShare: number; // 0-1
};

function countWords(s: string): number {
  return String(s || '')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean).length;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sectionBody(md: string, heading: string): string {
  const re = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, 'im');
  const m = md.match(re);
  if (!m || m.index == null) return '';
  const start = m.index + m[0].length;
  const rest = md.slice(start);
  const next = rest.match(/^\n##\s+[^\n]+\s*$/im);
  const body = next && next.index != null ? rest.slice(0, next.index) : rest;
  return body.trim();
}

export function validateSectionLevelQuotas(md: string): {
  ok: boolean;
  reasons: string[];
  metrics: SectionQuotaMetrics;
} {
  const reasons: string[] = [];

  const objectives = sectionBody(md, 'Learning Objectives');
  const core = sectionBody(md, 'Core Concepts');
  const worked = sectionBody(md, 'Worked Example');
  const recap = sectionBody(md, 'Recap');
  const quick = sectionBody(md, 'Quick Check');

  const bySection = {
    'Learning Objectives': countWords(objectives),
    'Core Concepts': countWords(core),
    'Worked Example': countWords(worked),
    Recap: countWords(recap),
    'Quick Check': countWords(quick),
  };

  const totalWords = countWords(md);
  const coreConceptsShare = totalWords > 0 ? bySection['Core Concepts'] / totalWords : 0;

  // Quotas tuned to be resilient across domains and avoid overfitting.
  // Goal: prevent pathological "everything in Core Concepts" and ensure Worked Example has real substance.
  if (bySection['Learning Objectives'] > 140) reasons.push('objectives_too_long');
  if (coreConceptsShare > 0.7 && totalWords > 500) reasons.push('core_concepts_too_dominant');
  if (bySection['Worked Example'] < 180) reasons.push('worked_example_too_short');
  if (bySection.Recap < 40) reasons.push('recap_too_short');

  return {
    ok: reasons.length === 0,
    reasons,
    metrics: { totalWords, bySection, coreConceptsShare },
  };
}
