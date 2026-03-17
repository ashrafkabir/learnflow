import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const webDir = path.resolve(__dirname, '../..');

function readFile(filePath: string): string {
  return fs.readFileSync(path.join(webDir, filePath), 'utf-8');
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(path.join(webDir, filePath));
}

// S11-A01: Next.js 14 with App Router structure
describe('S11-A01: Next.js 14 App Router structure', () => {
  it('has App Router directory structure', () => {
    expect(fileExists('src/app/layout.tsx')).toBe(true);
    expect(fileExists('src/app/page.tsx')).toBe(true);
    expect(fileExists('src/app/features/page.tsx')).toBe(true);
    expect(fileExists('src/app/pricing/page.tsx')).toBe(true);
    expect(fileExists('src/app/download/page.tsx')).toBe(true);
    expect(fileExists('src/app/blog/page.tsx')).toBe(true);
  });

  it('has next.config.js', () => {
    expect(fileExists('next.config.js')).toBe(true);
  });

  it('has package.json with next dependency', () => {
    const pkg = JSON.parse(readFile('package.json'));
    expect(pkg.dependencies.next).toBeDefined();
  });
});

// S11-A02: Homepage hero
describe('S11-A02: Homepage hero', () => {
  it('has headline, subhead, CTA, and background animation', () => {
    const page = readFile('src/app/page.tsx');
    expect(page).toContain('data-component="hero"');
    expect(page).toContain('data-component="background-animation"');
    expect(page).toContain('Get Started Free');
    expect(page).toContain('See How It Works');
    expect(page).toContain('AI-Powered');
  });
});

// S11-A03: Features page — all 6 sections
describe('S11-A03: Features page — 6 feature sections', () => {
  it('has all 6 feature sections', () => {
    const page = readFile('src/app/features/page.tsx');
    expect(page).toContain('course-builder');
    expect(page).toContain('smart-notes');
    expect(page).toContain('adaptive-exams');
    expect(page).toContain('research-agent');
    expect(page).toContain('knowledge-mindmap');
    expect(page).toContain('marketplace');
  });
});

// S11-A04: Pricing page — Free vs Pro
describe('S11-A04: Pricing comparison', () => {
  it('has Free and Pro plans with comparison', () => {
    const page = readFile('src/app/pricing/page.tsx');
    expect(page).toContain("name: 'Free'");
    expect(page).toContain("name: 'Pro'");
    expect(page).toContain('pricing-comparison');
    expect(page).toContain('Managed API Keys');
    expect(page).toContain('Proactive Updates');
  });
});

// S11-A05: Download page — platform auto-detection
describe('S11-A05: Download page', () => {
  it('has platform detection data and all platforms', () => {
    const page = readFile('src/app/download/page.tsx');
    expect(page).toContain('platform-auto-detect');
    expect(page).toContain('macos');
    expect(page).toContain('windows');
    expect(page).toContain('ios');
    expect(page).toContain('android');
    expect(page).toContain('web');
  });
});

// S11-A06: Blog with MDX and syntax highlighting
describe('S11-A06: Blog with MDX rendering', () => {
  it('has blog posts and syntax-highlighted code', () => {
    const page = readFile('src/app/blog/page.tsx');
    expect(page).toContain('data-component="mdx-render"');
    expect(page).toContain('data-language="typescript"');
    expect(page).toContain('CourseBuilderAgent');
    expect(page).toContain('introducing-learnflow');
  });
});

// S11-A09: SEO — meta tags, OG tags, structured data, sitemap
describe('S11-A09: SEO', () => {
  it('has meta/OG tags in layout', () => {
    const layout = readFile('src/app/layout.tsx');
    expect(layout).toContain('openGraph');
    expect(layout).toContain('twitter');
    expect(layout).toContain('application/ld+json');
    expect(layout).toContain('SoftwareApplication');
  });

  it('has sitemap', () => {
    expect(fileExists('src/app/sitemap.ts')).toBe(true);
    const sitemap = readFile('src/app/sitemap.ts');
    expect(sitemap).toContain('learnflow.ai');
    expect(sitemap).toContain('/features');
    expect(sitemap).toContain('/pricing');
  });
});

// S11-A10: Mobile responsive — 375px references
describe('S11-A10: Mobile responsive', () => {
  it('uses responsive patterns (clamp, minmax, flex-wrap)', () => {
    const page = readFile('src/app/page.tsx');
    expect(page).toContain('clamp(');
    expect(page).toContain('minmax(');
    expect(page).toContain('flexWrap');
  });
});

// S11-A11: PostHog analytics
describe('S11-A11: PostHog analytics', () => {
  it('analytics module exists and disables in dev', () => {
    expect(fileExists('src/analytics.ts')).toBe(true);
    const analytics = readFile('src/analytics.ts');
    expect(analytics).toContain('PostHog');
    expect(analytics).toContain('isDev');
    expect(analytics).toContain('enabled: !isDev');
  });
});

// S11-A12: All page components have at least one test
describe('S11-A12: All pages tested', () => {
  it('this test file covers all pages', () => {
    // Each page is tested above via file content checks
    const pages = [
      'page.tsx',
      'features/page.tsx',
      'pricing/page.tsx',
      'download/page.tsx',
      'blog/page.tsx',
    ];
    for (const p of pages) {
      expect(fileExists(`src/app/${p}`)).toBe(true);
    }
  });
});
