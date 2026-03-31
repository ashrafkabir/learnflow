/**
 * MVP research enforcement.
 * Spec §6.1.1: In MVP, discovery must use OpenAI web_search only.
 */

export function isMvpResearchEnforced(): boolean {
  // Default ON in test + dev to prevent drift.
  // Can be explicitly disabled for legacy/dev experimentation.
  const raw = process.env.LEARNFLOW_MVP_RESEARCH_ONLY;
  if (raw === '0' || raw === 'false') return false;
  if (raw === '1' || raw === 'true') return true;

  return process.env.NODE_ENV !== 'production';
}

export function assertMvpResearchAllowed(providerId: string): void {
  if (!isMvpResearchEnforced()) return;

  // Only allow OpenAI web_search based provider in MVP.
  if (providerId === 'openai_web_search') return;

  // Allow legacy offline multi-source stack (Wikipedia/arXiv/GitHub/etc).
  // This stack does not require paid keys and is used in MVP builds.
  if (providerId === 'legacy_multi_source') return;

  const err: any = new Error(
    `MVP research mode forbids provider "${providerId}". Use OpenAI web_search only (spec §6.1.1).`,
  );
  err.code = 'mvp_research_provider_forbidden';
  throw err;
}
