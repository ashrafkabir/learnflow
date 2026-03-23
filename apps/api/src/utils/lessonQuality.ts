export type LessonDomain = 'programming' | 'math_science' | 'business' | 'general';

function hasFencedCodeBlock(md: string): boolean {
  return /```[a-zA-Z0-9_-]*\n[\s\S]*?```/m.test(md);
}

function hasMathOrStepByStep(md: string): boolean {
  // Heuristic: contains numbered steps or an equation-ish token.
  return /(\n\s*\d+\.)|(=)|(\btherefore\b)|(\bderive\b)/i.test(md);
}

function hasTable(md: string): boolean {
  return /\n\|.+\|\n\|[-:|\s]+\|/m.test(md);
}

function hasScenarioTradeoff(md: string): boolean {
  return (
    /(scenario|trade-?off|decision|option)/i.test(md) && (hasTable(md) || /pros|cons/i.test(md))
  );
}

export function validateWorkedExampleQuality(
  md: string,
  domain: LessonDomain,
): {
  ok: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (!/## Worked Example/i.test(md)) {
    reasons.push('missing_worked_example_heading');
  }

  if (domain === 'programming') {
    if (!hasFencedCodeBlock(md)) reasons.push('programming_requires_code_block');
  } else if (domain === 'math_science') {
    if (!hasMathOrStepByStep(md)) reasons.push('math_science_requires_steps_or_equation');
  } else if (domain === 'business') {
    if (!hasScenarioTradeoff(md)) reasons.push('business_requires_scenario_tradeoff');
  }

  return { ok: reasons.length === 0, reasons };
}
