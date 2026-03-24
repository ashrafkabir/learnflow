import { describe, it, expect } from 'vitest';
import {
  validateNoPlaceholders,
  validateWorkedExampleQuality,
  type LessonDomain,
} from '../utils/lessonQuality.js';

const base = `# Title\n\n## Worked Example\n\n`;

describe('Iter73: lesson narration quality hard gates', () => {
  it('rejects placeholder patterns like "Example (fill in)", TBD/TODO, Q1/A1', () => {
    const md = `${base}Example (fill in)\n\n## Quick Check\n\n1. Q1\n\n### Answer Key\n\n1. A1\n\nTBD`;
    const res = validateNoPlaceholders(md);
    expect(res.ok).toBe(false);
    expect(res.reasons.join(',')).toBeTruthy();
  });

  it('programming domain requires runnable code + how to run + expected output inside Worked Example', () => {
    const domain: LessonDomain = 'programming';
    const md = `# T\n\n## Worked Example\n\nHow to run:\n\n\`\`\`bash\nnode example.js\n\`\`\`\n\n\`\`\`js\nconsole.log(2 + 3);\n\`\`\`\n\nExpected output:\n\n\`\`\`text\n5\n\`\`\``;
    const res = validateWorkedExampleQuality(md, domain);
    expect(res.ok).toBe(true);
  });

  it('business domain requires scenario + numbers + trade-off structure', () => {
    const domain: LessonDomain = 'business';
    const md = `# T\n\n## Worked Example\n\nScenario: Budget is $10,000 and you must choose.\n\n| Option | Cost | Benefit | Risk |\n|---|---:|---|---|\n| A | 4000 | Faster | Medium |\n| B | 9000 | Higher quality | Low |`;
    const res = validateWorkedExampleQuality(md, domain);
    expect(res.ok).toBe(true);
  });

  it('cooking domain requires numbered steps with time/temp language', () => {
    const domain: LessonDomain = 'cooking';
    const md = `# T\n\n## Worked Example\n\n1. Heat pan to medium for 2 minutes.\n2. Simmer for 5 minutes.`;
    const res = validateWorkedExampleQuality(md, domain);
    expect(res.ok).toBe(true);
  });
});
