// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

// Iter146: Improve/Dig Deeper response parsing must never persist raw JSON.
// This is a small pure-function style test (local) so we don't need to mount LessonReader.

type Preview = {
  newTitle?: string;
  markdown?: string;
  images?: Array<{
    url: string;
    caption?: string;
    license?: string;
    author?: string;
    sourcePageUrl?: string;
  }>;
  links?: Array<{ title: string; url: string; source?: string }>;
};

function buildMarkdownFromPreview(preview: Preview): string {
  let markdown = String(preview.markdown || '').trim();
  const images = (preview.images || [])
    .map((img) => ({
      url: String(img.url || '').trim(),
      caption: String(img.caption || 'Image').trim(),
      license: img.license ? String(img.license) : 'Wikimedia Commons',
      author: img.author ? String(img.author) : '',
      sourcePageUrl: img.sourcePageUrl ? String(img.sourcePageUrl) : '',
    }))
    .filter((img) => /^https?:\/\//.test(img.url));

  if (images.length) {
    markdown = `${markdown}\n\n${images
      .slice(0, 2)
      .map(
        (img) =>
          `![${img.caption}](${img.url})\n> Attribution: ${img.license}${img.author ? ` · ${img.author}` : ''}${img.sourcePageUrl ? ` · ${img.sourcePageUrl}` : ''}`,
      )
      .join('\n\n')}`.trim();
  }

  const links = (preview.links || [])
    .map((l) => ({ title: String(l.title || '').trim(), url: String(l.url || '').trim() }))
    .filter((l) => l.title && /^https?:\/\//.test(l.url));

  if (links.length && !/Further resources/i.test(markdown)) {
    markdown = `${markdown}\n\n### Further resources\n${links
      .slice(0, 6)
      .map((l) => `- [${l.title}](${l.url})`)
      .join('\n')}`.trim();
  }

  // Guard: no JSON keys in persisted markdown
  expect(markdown).not.toMatch(/"markdown"|"links"|"images"/);
  return markdown;
}

describe('Iter146 improve response parsing', () => {
  it('embeds images and links as markdown (no JSON keys)', () => {
    const preview: Preview = {
      markdown: '## Improved subsection\n\nSome richer explanation.',
      images: [
        {
          url: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png',
          caption: 'JavaScript logo',
          license: 'Public domain',
          author: 'Wikimedia',
          sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:JavaScript-logo.png',
        },
      ],
      links: [
        { title: 'MDN JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
      ],
    };

    const md = buildMarkdownFromPreview(preview);
    expect(md).toContain('Some richer explanation.');
    expect(md).toContain('![JavaScript logo](');
    expect(md).toContain('Attribution:');
    expect(md).toContain('### Further resources');
    expect(md).toContain(
      '- [MDN JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)',
    );
  });
});
