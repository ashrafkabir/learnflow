import { validateNoPlaceholders, validateWorkedExampleQuality, type LessonDomain } from './lessonQuality.js';

export type Stage2RetryReason =
  | 'worked_example_missing'
  | 'section_quota_failed'
  | 'placeholders_present'
  | 'sources_thin'
  | 'domain_diversity_low';

const HINT_TOKENS = [
  'worked example',
  'step-by-step',
  'reference implementation',
  'numerical example',
  'example output',
  'how to run',
];

/**
 * Given a set of failure reasons, returns additional search query templates that include explicit hint tokens.
 * These templates are intended to be injected into stage2Templates for a retry searchForLesson call.
 */
export function buildStage2RetryTemplates(params: {
  courseTopic: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonDescription: string;
  missingReasons: Stage2RetryReason[];
}): string[] {
  const { lessonTitle, courseTopic, lessonDescription, missingReasons } = params;

  // Always inject hint tokens (spec requirement) when retrying.
  const base = [
    `${lessonTitle} ${courseTopic} worked example step-by-step`,
    `${lessonTitle} ${courseTopic} reference implementation`,
    `${lessonTitle} ${courseTopic} numerical example`,
    `${lessonTitle} ${courseTopic} example output how to run`,
    `${lessonDescription} worked example`,
  ];

  // If sourcing failure, also broaden to “guide” phrasing.
  if (missingReasons.includes('sources_thin') || missingReasons.includes('domain_diversity_low')) {
    base.push(`${lessonTitle} ${courseTopic} tutorial guide step-by-step`);
  }

  // Deterministic unique
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of base) {
    const s = String(q || '').replace(/\s+/g, ' ').trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export function queryContainsHintTokens(q: string): boolean {
  const lower = String(q || '').toLowerCase();
  return HINT_TOKENS.some((t) => lower.includes(t));
}

/**
 * Maps lesson content validation failures to structured Stage2RetryReason values.
 * Note: section quota failures are handled by the caller if quota telemetry is available.
 */
export function inferMissingReasonsFromLessonContent(params: {
  markdown: string;
  lessonDomain: LessonDomain;
  includeSectionQuotaFailed?: boolean;
}): Stage2RetryReason[] {
  const { markdown, lessonDomain, includeSectionQuotaFailed } = params;
  const out: Stage2RetryReason[] = [];

  const placeholder = validateNoPlaceholders(markdown);
  if (!placeholder.ok) out.push('placeholders_present');

  const quality = validateWorkedExampleQuality(markdown, lessonDomain);
  if (!quality.ok) out.push('worked_example_missing');

  if (includeSectionQuotaFailed) out.push('section_quota_failed');

  return out;
}
