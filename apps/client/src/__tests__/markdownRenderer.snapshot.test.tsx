// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { MarkdownRenderer } from '../lib/markdownRenderer.js';

// Deterministic rich message fixture: code + table + math
const FIXTURE = `# Title\n\nInline math: $E=mc^2$\n\n\n## Code\n\n\`\`\`ts\nconst x: number = 1\nconsole.log(x)\n\`\`\`\n\n## Table\n\n| Col A | Col B |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |\n\nBlock math:\n\n$$\\int_0^1 x^2 \\, dx = \\frac{1}{3}$$\n`;

describe('MarkdownRenderer', () => {
  it('renders rich markdown deterministically (code + table + math)', () => {
    const { container } = render(<MarkdownRenderer content={FIXTURE} />);
    // Snapshot the DOM structure; avoid relying on highlight.js language classnames.
    expect(container.firstChild).toMatchSnapshot();
  });
});
