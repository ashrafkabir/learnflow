(() => {
  var e = {};
  ((e.id = 200),
    (e.ids = [200]),
    (e.modules = {
      7849: (e) => {
        'use strict';
        e.exports = require('next/dist/client/components/action-async-storage.external');
      },
      2934: (e) => {
        'use strict';
        e.exports = require('next/dist/client/components/action-async-storage.external.js');
      },
      5403: (e) => {
        'use strict';
        e.exports = require('next/dist/client/components/request-async-storage.external');
      },
      4580: (e) => {
        'use strict';
        e.exports = require('next/dist/client/components/request-async-storage.external.js');
      },
      4749: (e) => {
        'use strict';
        e.exports = require('next/dist/client/components/static-generation-async-storage.external');
      },
      5869: (e) => {
        'use strict';
        e.exports = require('next/dist/client/components/static-generation-async-storage.external.js');
      },
      399: (e) => {
        'use strict';
        e.exports = require('next/dist/compiled/next-server/app-page.runtime.prod.js');
      },
      3385: (e, t, r) => {
        'use strict';
        (r.r(t),
          r.d(t, {
            GlobalError: () => o.a,
            __next_app__: () => h,
            originalPathname: () => p,
            pages: () => c,
            routeModule: () => u,
            tree: () => d,
          }),
          r(2561),
          r(7718),
          r(7824));
        var i = r(3282),
          n = r(5736),
          s = r(3906),
          o = r.n(s),
          a = r(6880),
          l = {};
        for (let e in a)
          0 >
            [
              'default',
              'tree',
              'pages',
              'GlobalError',
              'originalPathname',
              '__next_app__',
              'routeModule',
            ].indexOf(e) && (l[e] = () => a[e]);
        r.d(t, l);
        let d = [
            '',
            {
              children: [
                'features',
                {
                  children: [
                    '__PAGE__',
                    {},
                    {
                      page: [
                        () => Promise.resolve().then(r.bind(r, 2561)),
                        '/home/aifactory/.openclaw/workspace/learnflow/apps/web/src/app/features/page.tsx',
                      ],
                    },
                  ],
                },
                {},
              ],
            },
            {
              layout: [
                () => Promise.resolve().then(r.bind(r, 7718)),
                '/home/aifactory/.openclaw/workspace/learnflow/apps/web/src/app/layout.tsx',
              ],
              'not-found': [
                () => Promise.resolve().then(r.t.bind(r, 7824, 23)),
                'next/dist/client/components/not-found-error',
              ],
            },
          ],
          c = ['/home/aifactory/.openclaw/workspace/learnflow/apps/web/src/app/features/page.tsx'],
          p = '/features/page',
          h = { require: r, loadChunk: () => Promise.resolve() },
          u = new i.AppPageRouteModule({
            definition: {
              kind: n.x.APP_PAGE,
              page: '/features/page',
              pathname: '/features',
              bundlePath: '',
              filename: '',
              appPaths: [],
            },
            userland: { loaderTree: d },
          });
      },
      3963: (e, t, r) => {
        (Promise.resolve().then(r.t.bind(r, 4424, 23)),
          Promise.resolve().then(r.t.bind(r, 7752, 23)),
          Promise.resolve().then(r.t.bind(r, 5275, 23)),
          Promise.resolve().then(r.t.bind(r, 9842, 23)),
          Promise.resolve().then(r.t.bind(r, 1633, 23)),
          Promise.resolve().then(r.t.bind(r, 9224, 23)));
      },
      3245: () => {},
      2561: (e, t, r) => {
        'use strict';
        (r.r(t), r.d(t, { default: () => n }));
        var i = r(9013);
        function n() {
          return (0, i.jsxs)('div', {
            'data-page': 'features',
            style: { maxWidth: 900, margin: '0 auto', padding: '60px 24px' },
            children: [
              i.jsx('h1', {
                style: { fontSize: 40, fontWeight: 800, textAlign: 'center', marginBottom: 16 },
                children: 'Features',
              }),
              i.jsx('p', {
                style: { textAlign: 'center', fontSize: 18, color: '#6b7280', marginBottom: 64 },
                children: 'Six AI agents working together to transform how you learn.',
              }),
              [
                {
                  id: 'course-builder',
                  title: 'AI Course Builder',
                  description:
                    'Enter any topic and our AI generates a structured, multi-module course with real web sources. Each lesson includes learning objectives, examples, code blocks, and full source attribution.',
                  highlights: [
                    'Firecrawl-powered web research',
                    'Credibility-scored sources',
                    'Prerequisite-ordered modules',
                  ],
                },
                {
                  id: 'smart-notes',
                  title: 'Smart Notes & Flashcards',
                  description:
                    'Automatically generate study materials from any lesson. Choose from Cornell format, Zettelkasten atomic notes, or spaced-repetition flashcards.',
                  highlights: [
                    'Cornell note format',
                    'Zettelkasten with inter-links',
                    '10+ flashcards per lesson',
                  ],
                },
                {
                  id: 'adaptive-exams',
                  title: 'Adaptive Exams & Knowledge Gaps',
                  description:
                    'AI-generated quizzes that test comprehension, not just recall. Get detailed knowledge gap analysis showing exactly what to review.',
                  highlights: [
                    'Multiple choice & short answer',
                    "Bloom's taxonomy coverage",
                    'Knowledge gap analysis',
                  ],
                },
                {
                  id: 'research-agent',
                  title: 'Research Agent',
                  description:
                    'Search academic papers, synthesize findings, and get structured research summaries. Powered by Semantic Scholar and web scraping.',
                  highlights: [
                    'Academic paper search',
                    'Structured synthesis',
                    'Citation management',
                  ],
                },
                {
                  id: 'knowledge-mindmap',
                  title: 'Knowledge Mindmap',
                  description:
                    'Visualize how your learning connects across courses. Interactive graph with mastery indicators and CRDT-powered collaborative editing.',
                  highlights: [
                    'Interactive visualization',
                    'Cross-course connections',
                    'Collaborative editing',
                  ],
                },
                {
                  id: 'marketplace',
                  title: 'Course & Agent Marketplace',
                  description:
                    'Share your AI-generated courses with the community. Browse, enroll, and rate courses from other creators. Extend LearnFlow with custom agents.',
                  highlights: [
                    'Publish & monetize courses',
                    'Community ratings',
                    'Custom agent SDK',
                  ],
                },
              ].map((e, t) =>
                (0, i.jsxs)(
                  'section',
                  {
                    'data-feature': e.id,
                    'aria-label': e.title,
                    style: {
                      display: 'flex',
                      flexDirection: t % 2 == 0 ? 'row' : 'row-reverse',
                      gap: 48,
                      alignItems: 'center',
                      marginBottom: 80,
                      flexWrap: 'wrap',
                    },
                    children: [
                      (0, i.jsxs)('div', {
                        style: { flex: 1, minWidth: 280 },
                        children: [
                          i.jsx('h2', {
                            style: { fontSize: 28, fontWeight: 700 },
                            children: e.title,
                          }),
                          i.jsx('p', {
                            style: {
                              fontSize: 16,
                              color: '#4b5563',
                              lineHeight: 1.6,
                              marginTop: 12,
                            },
                            children: e.description,
                          }),
                          i.jsx('ul', {
                            style: { marginTop: 16, listStyle: 'none', padding: 0 },
                            children: e.highlights.map((e) =>
                              (0, i.jsxs)(
                                'li',
                                {
                                  style: { fontSize: 14, color: '#6366F1', marginBottom: 8 },
                                  children: ['✓ ', e],
                                },
                                e,
                              ),
                            ),
                          }),
                        ],
                      }),
                      (0, i.jsxs)('div', {
                        style: {
                          flex: 1,
                          minWidth: 280,
                          height: 220,
                          background: '#f3f4f6',
                          borderRadius: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          color: '#9ca3af',
                        },
                        children: ['[Screenshot: ', e.title, ']'],
                      }),
                    ],
                  },
                  e.id,
                ),
              ),
            ],
          });
        }
        r(6321);
      },
      7718: (e, t, r) => {
        'use strict';
        (r.r(t), r.d(t, { default: () => s, metadata: () => n }));
        var i = r(9013);
        r(6321);
        let n = {
          title: 'LearnFlow — AI-Powered Personalized Learning',
          description:
            'LearnFlow uses AI agents to create personalized courses, notes, quizzes, and research from any topic. Your AI study companion.',
          openGraph: {
            title: 'LearnFlow — AI-Powered Personalized Learning',
            description:
              'Create personalized courses with AI agents. Notes, quizzes, research, and mindmaps.',
            type: 'website',
            url: 'https://learnflow.ai',
            images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'LearnFlow' }],
          },
          twitter: {
            card: 'summary_large_image',
            title: 'LearnFlow — AI-Powered Personalized Learning',
            description: 'Create personalized courses with AI agents.',
          },
        };
        function s({ children: e }) {
          return (0, i.jsxs)('html', {
            lang: 'en',
            children: [
              (0, i.jsxs)('head', {
                children: [
                  i.jsx('meta', {
                    name: 'viewport',
                    content: 'width=device-width, initial-scale=1',
                  }),
                  i.jsx('link', { rel: 'icon', href: '/favicon.ico' }),
                  i.jsx('script', {
                    type: 'application/ld+json',
                    dangerouslySetInnerHTML: {
                      __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'SoftwareApplication',
                        name: 'LearnFlow',
                        applicationCategory: 'EducationalApplication',
                        operatingSystem: 'macOS, Windows, iOS, Android',
                        description: 'AI-powered personalized learning platform',
                      }),
                    },
                  }),
                ],
              }),
              (0, i.jsxs)('body', {
                style: {
                  margin: 0,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  color: '#111827',
                },
                children: [
                  (0, i.jsxs)('nav', {
                    'data-component': 'site-nav',
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 24px',
                      borderBottom: '1px solid #e5e7eb',
                      position: 'sticky',
                      top: 0,
                      background: 'white',
                      zIndex: 100,
                    },
                    children: [
                      i.jsx('a', {
                        href: '/',
                        style: {
                          fontWeight: 700,
                          fontSize: 20,
                          color: '#6366F1',
                          textDecoration: 'none',
                        },
                        children: 'LearnFlow',
                      }),
                      (0, i.jsxs)('div', {
                        style: { display: 'flex', gap: 24, fontSize: 14 },
                        children: [
                          i.jsx('a', { href: '/features', children: 'Features' }),
                          i.jsx('a', { href: '/pricing', children: 'Pricing' }),
                          i.jsx('a', { href: '/download', children: 'Download' }),
                          i.jsx('a', { href: '/blog', children: 'Blog' }),
                        ],
                      }),
                      i.jsx('a', {
                        href: '/download',
                        style: {
                          padding: '8px 20px',
                          background: '#6366F1',
                          color: 'white',
                          borderRadius: 8,
                          textDecoration: 'none',
                          fontSize: 14,
                          fontWeight: 600,
                        },
                        children: 'Get Started',
                      }),
                    ],
                  }),
                  i.jsx('main', { children: e }),
                  i.jsx('footer', {
                    style: {
                      padding: '48px 24px',
                      background: '#f9fafb',
                      borderTop: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontSize: 14,
                      color: '#6b7280',
                    },
                    children: i.jsx('p', {
                      children: '\xa9 2026 LearnFlow. AI-powered personalized learning.',
                    }),
                  }),
                ],
              }),
            ],
          });
        }
      },
    }));
  var t = require('../../webpack-runtime.js');
  t.C(e);
  var r = (e) => t((t.s = e)),
    i = t.X(0, [522, 679], () => r(3385));
  module.exports = i;
})();
