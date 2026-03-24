export type LessonDomain = 'programming' | 'math_science' | 'business' | 'cooking' | 'general';

export type LessonQualityFailure = {
  ok: boolean;
  reasons: string[];
};

function sectionBody(md: string, heading: string): string {
  // Extract content under a "## <heading>" section until the next "## " heading.
  const re = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, 'im');
  const m = md.match(re);
  if (!m || m.index == null) return '';

  const start = m.index + m[0].length;
  const rest = md.slice(start);
  const next = rest.match(/^\n##\s+[^\n]+\s*$/im);
  const body = next && next.index != null ? rest.slice(0, next.index) : rest;
  return body.trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasFencedCodeBlock(md: string): boolean {
  return /```[a-zA-Z0-9_-]*\n[\s\S]*?```/m.test(md);
}

function hasExpectedOutput(md: string): boolean {
  return /(expected output|output should|you should see)/i.test(md);
}

function hasHowToRun(md: string): boolean {
  return /(how to run|run (it|this)|execute|command:)/i.test(md);
}

function hasMathStepsWithNumbers(md: string): boolean {
  // Require at least one explicit numeric token and step-by-step structure.
  const hasDigits = /\d/.test(md);
  const hasSteps = /(\n\s*\d+\.)|(step\s*\d+)|(first,|then,|therefore\b)/i.test(md);
  const hasEquation = /(=)|([+\-*/])/.test(md);
  return hasDigits && (hasSteps || hasEquation);
}

function hasTable(md: string): boolean {
  return /\n\|.+\|\n\|[-:|\s]+\|/m.test(md);
}

function hasScenarioTradeoffWithNumbers(md: string): boolean {
  const hasScenario = /(scenario|case|decision|option|trade-?off)/i.test(md);
  const hasNumbers = /\d/.test(md);
  const hasTradeoffStructure = hasTable(md) || /pros\b|cons\b|risk\b|cost\b|benefit\b/i.test(md);
  return hasScenario && hasNumbers && hasTradeoffStructure;
}

function hasCookingSteps(md: string): boolean {
  // Require actionable recipe-like steps.
  const hasNumberedSteps = /(\n\s*\d+\.)|(step\s*\d+)/i.test(md);
  const hasTimeOrTemp =
    /(\bminutes?\b|\bhours?\b|\b°[CF]\b|\bdegrees\b|\bheat\b|\bsimmer\b|\bbake\b)/i.test(md);
  return hasNumberedSteps && hasTimeOrTemp;
}

function containsVagueLanguage(md: string): boolean {
  // Heuristic: detect common non-answers that frequently appear in under-worked examples.
  // This should be conservative (avoid false positives) but catch egregious cases.
  return /(and so on|etc\.|\.\.\.|fill\s+in|left as an exercise|obvious|straightforward|as needed|various|some (?:values|things|steps))/i.test(
    md,
  );
}

function hasConcreteArtifact(md: string): boolean {
  // Require at least one concrete artifact token:
  // - code fence
  // - markdown table
  // - explicit digits
  // - numbered steps
  return (
    hasFencedCodeBlock(md) || hasTable(md) || /\d/.test(md) || /(\n\s*\d+\.)|(step\s*\d+)/i.test(md)
  );
}

export function validateNoPlaceholders(md: string): LessonQualityFailure {
  const reasons: string[] = [];
  if (/(example\s*\(fill\s*in\))/i.test(md)) reasons.push('contains_example_fill_in');
  if (/(\bTBD\b|\bTODO\b)/.test(md)) reasons.push('contains_tbd_todo');
  if (/\bQ1\b|\bA1\b/.test(md)) reasons.push('contains_q1_a1_placeholders');
  if (/placeholder/i.test(md)) reasons.push('contains_placeholder_text');
  return { ok: reasons.length === 0, reasons };
}

export function validateQuickCheckHasAnswerKey(md: string): LessonQualityFailure {
  const reasons: string[] = [];

  if (!/##\s+Quick Check/i.test(md)) {
    reasons.push('missing_quick_check_heading');
    return { ok: false, reasons };
  }

  const quick = sectionBody(md, 'Quick Check');
  if (!quick) {
    reasons.push('quick_check_section_empty');
    return { ok: false, reasons };
  }

  // Must contain an explicit answer key and at least one answer entry.
  if (!/answer\s*key/i.test(quick)) reasons.push('quick_check_missing_answer_key_heading');

  const hasAnswerEntry =
    /(answer\s*key[\s\S]{0,600})(\n\s*[-*]\s+|\n\s*\d+\.|\bA\b\s*[:-]|\bAnswer\b\s*[:-])/i.test(
      quick,
    );
  if (!hasAnswerEntry) reasons.push('quick_check_missing_answer_key_entries');

  return { ok: reasons.length === 0, reasons };
}

export function validateWorkedExampleQuality(
  md: string,
  domain: LessonDomain,
): LessonQualityFailure {
  const reasons: string[] = [];
  if (!/## Worked Example/i.test(md)) {
    reasons.push('missing_worked_example_heading');
    return { ok: false, reasons };
  }

  const worked = sectionBody(md, 'Worked Example');
  if (!worked) {
    reasons.push('worked_example_section_empty');
    return { ok: false, reasons };
  }

  // Cross-domain hard requirement: no vague, un-worked examples.
  if (containsVagueLanguage(worked)) reasons.push('worked_example_contains_vague_language');
  if (!hasConcreteArtifact(worked)) reasons.push('worked_example_requires_concrete_artifact');

  if (domain === 'programming') {
    if (!hasFencedCodeBlock(worked))
      reasons.push('programming_requires_code_block_in_worked_example');
    if (!hasExpectedOutput(worked)) reasons.push('programming_requires_expected_output');
    if (!hasHowToRun(worked)) reasons.push('programming_requires_how_to_run');
  } else if (domain === 'math_science') {
    if (!hasMathStepsWithNumbers(worked)) reasons.push('math_science_requires_numeric_steps');
  } else if (domain === 'business') {
    if (!hasScenarioTradeoffWithNumbers(worked))
      reasons.push('business_requires_scenario_tradeoff_with_numbers');
  } else if (domain === 'cooking') {
    if (!hasCookingSteps(worked)) reasons.push('cooking_requires_numbered_steps_with_time_or_temp');
  }

  return { ok: reasons.length === 0, reasons };
}
