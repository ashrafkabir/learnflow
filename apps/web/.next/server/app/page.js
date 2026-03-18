(() => {
  var e = {};
  ((e.id = 931),
    (e.ids = [931]),
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
      1491: (e, t, n) => {
        'use strict';
        (n.r(t),
          n.d(t, {
            GlobalError: () => a.a,
            __next_app__: () => x,
            originalPathname: () => p,
            pages: () => c,
            routeModule: () => h,
            tree: () => d,
          }),
          n(151),
          n(7718),
          n(7824));
        var r = n(3282),
          i = n(5736),
          o = n(3906),
          a = n.n(o),
          s = n(6880),
          l = {};
        for (let e in s)
          0 >
            [
              'default',
              'tree',
              'pages',
              'GlobalError',
              'originalPathname',
              '__next_app__',
              'routeModule',
            ].indexOf(e) && (l[e] = () => s[e]);
        n.d(t, l);
        let d = [
            '',
            {
              children: [
                '__PAGE__',
                {},
                {
                  page: [
                    () => Promise.resolve().then(n.bind(n, 151)),
                    '/home/aifactory/.openclaw/workspace/learnflow/apps/web/src/app/page.tsx',
                  ],
                },
              ],
            },
            {
              layout: [
                () => Promise.resolve().then(n.bind(n, 7718)),
                '/home/aifactory/.openclaw/workspace/learnflow/apps/web/src/app/layout.tsx',
              ],
              'not-found': [
                () => Promise.resolve().then(n.t.bind(n, 7824, 23)),
                'next/dist/client/components/not-found-error',
              ],
            },
          ],
          c = ['/home/aifactory/.openclaw/workspace/learnflow/apps/web/src/app/page.tsx'],
          p = '/page',
          x = { require: n, loadChunk: () => Promise.resolve() },
          h = new r.AppPageRouteModule({
            definition: {
              kind: i.x.APP_PAGE,
              page: '/page',
              pathname: '/',
              bundlePath: '',
              filename: '',
              appPaths: [],
            },
            userland: { loaderTree: d },
          });
      },
      3963: (e, t, n) => {
        (Promise.resolve().then(n.t.bind(n, 4424, 23)),
          Promise.resolve().then(n.t.bind(n, 7752, 23)),
          Promise.resolve().then(n.t.bind(n, 5275, 23)),
          Promise.resolve().then(n.t.bind(n, 9842, 23)),
          Promise.resolve().then(n.t.bind(n, 1633, 23)),
          Promise.resolve().then(n.t.bind(n, 9224, 23)));
      },
      3245: () => {},
      7718: (e, t, n) => {
        'use strict';
        (n.r(t), n.d(t, { default: () => o, metadata: () => i }));
        var r = n(9013);
        n(6321);
        let i = {
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
        function o({ children: e }) {
          return (0, r.jsxs)('html', {
            lang: 'en',
            children: [
              (0, r.jsxs)('head', {
                children: [
                  r.jsx('meta', {
                    name: 'viewport',
                    content: 'width=device-width, initial-scale=1',
                  }),
                  r.jsx('link', { rel: 'icon', href: '/favicon.ico' }),
                  r.jsx('script', {
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
              (0, r.jsxs)('body', {
                style: {
                  margin: 0,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  color: '#111827',
                },
                children: [
                  (0, r.jsxs)('nav', {
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
                      r.jsx('a', {
                        href: '/',
                        style: {
                          fontWeight: 700,
                          fontSize: 20,
                          color: '#6366F1',
                          textDecoration: 'none',
                        },
                        children: 'LearnFlow',
                      }),
                      (0, r.jsxs)('div', {
                        style: { display: 'flex', gap: 24, fontSize: 14 },
                        children: [
                          r.jsx('a', { href: '/features', children: 'Features' }),
                          r.jsx('a', { href: '/pricing', children: 'Pricing' }),
                          r.jsx('a', { href: '/download', children: 'Download' }),
                          r.jsx('a', { href: '/blog', children: 'Blog' }),
                        ],
                      }),
                      r.jsx('a', {
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
                  r.jsx('main', { children: e }),
                  r.jsx('footer', {
                    style: {
                      padding: '48px 24px',
                      background: '#f9fafb',
                      borderTop: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontSize: 14,
                      color: '#6b7280',
                    },
                    children: r.jsx('p', {
                      children: '\xa9 2026 LearnFlow. AI-powered personalized learning.',
                    }),
                  }),
                ],
              }),
            ],
          });
        }
      },
      151: (e, t, n) => {
        'use strict';
        (n.r(t), n.d(t, { default: () => i }));
        var r = n(9013);
        function i() {
          return (0, r.jsxs)('div', {
            'data-page': 'home',
            children: [
              (0, r.jsxs)('section', {
                'data-component': 'hero',
                'aria-label': 'Hero',
                style: {
                  minHeight: '80vh',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '80px 24px',
                  background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #C7D2FE 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                },
                children: [
                  r.jsx('div', {
                    'data-component': 'background-animation',
                    'aria-hidden': 'true',
                    style: {
                      position: 'absolute',
                      inset: 0,
                      background:
                        'radial-gradient(circle at 30% 50%, rgba(99,102,241,0.1) 0%, transparent 50%)',
                      animation: 'pulse 4s ease-in-out infinite',
                    },
                  }),
                  (0, r.jsxs)('h1', {
                    style: {
                      fontSize: 'clamp(36px, 6vw, 72px)',
                      fontWeight: 800,
                      lineHeight: 1.1,
                      maxWidth: 800,
                      position: 'relative',
                    },
                    children: [
                      'Learn Anything with ',
                      r.jsx('span', { style: { color: '#6366F1' }, children: 'AI-Powered' }),
                      ' Courses',
                    ],
                  }),
                  r.jsx('p', {
                    style: {
                      fontSize: 'clamp(16px, 2vw, 20px)',
                      color: '#4b5563',
                      maxWidth: 600,
                      marginTop: 24,
                      lineHeight: 1.6,
                      position: 'relative',
                    },
                    children:
                      'LearnFlow creates personalized courses, notes, quizzes, and research from any topic — powered by a team of AI agents working together.',
                  }),
                  (0, r.jsxs)('div', {
                    style: { display: 'flex', gap: 16, marginTop: 40, position: 'relative' },
                    children: [
                      r.jsx('a', {
                        href: '/download',
                        'aria-label': 'Get Started Free',
                        style: {
                          padding: '14px 32px',
                          background: '#6366F1',
                          color: 'white',
                          borderRadius: 12,
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: 16,
                        },
                        children: 'Get Started Free',
                      }),
                      r.jsx('a', {
                        href: '/features',
                        'aria-label': 'See How It Works',
                        style: {
                          padding: '14px 32px',
                          border: '2px solid #6366F1',
                          color: '#6366F1',
                          borderRadius: 12,
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: 16,
                        },
                        children: 'See How It Works',
                      }),
                    ],
                  }),
                ],
              }),
              (0, r.jsxs)('section', {
                style: { padding: '48px 24px', textAlign: 'center' },
                children: [
                  r.jsx('p', {
                    style: { fontSize: 14, color: '#9ca3af', marginBottom: 16 },
                    children: 'Trusted by learners from',
                  }),
                  r.jsx('div', {
                    style: {
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 48,
                      flexWrap: 'wrap',
                      opacity: 0.5,
                    },
                    children: ['MIT', 'Stanford', 'Google', 'Microsoft', 'Amazon'].map((e) =>
                      r.jsx(
                        'span',
                        { style: { fontSize: 18, fontWeight: 600, color: '#374151' }, children: e },
                        e,
                      ),
                    ),
                  }),
                ],
              }),
              (0, r.jsxs)('section', {
                style: { padding: '80px 24px', maxWidth: 1e3, margin: '0 auto' },
                children: [
                  r.jsx('h2', {
                    style: { fontSize: 32, fontWeight: 700, textAlign: 'center', marginBottom: 48 },
                    children: 'One Platform. Six AI Agents.',
                  }),
                  r.jsx('div', {
                    style: {
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: 32,
                    },
                    children: [
                      {
                        icon: '\uD83D\uDCDA',
                        title: 'Course Builder',
                        desc: 'Generate structured courses from any topic with real web sources.',
                      },
                      {
                        icon: '\uD83D\uDCDD',
                        title: 'Notes Agent',
                        desc: 'Cornell notes, Zettelkasten, and flashcards from any lesson.',
                      },
                      {
                        icon: '\uD83E\uDDEA',
                        title: 'Exam Agent',
                        desc: 'Adaptive quizzes that identify knowledge gaps.',
                      },
                      {
                        icon: '\uD83D\uDD2C',
                        title: 'Research Agent',
                        desc: 'Find and synthesize academic papers and articles.',
                      },
                      {
                        icon: '\uD83D\uDDFA️',
                        title: 'Knowledge Mindmap',
                        desc: 'Visualize learning connections across all your courses.',
                      },
                      {
                        icon: '\uD83C\uDFEA',
                        title: 'Marketplace',
                        desc: 'Share courses and discover community-created content.',
                      },
                    ].map((e) =>
                      (0, r.jsxs)(
                        'div',
                        {
                          style: { padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' },
                          children: [
                            r.jsx('div', { style: { fontSize: 32 }, children: e.icon }),
                            r.jsx('h3', {
                              style: { fontSize: 18, fontWeight: 600, marginTop: 12 },
                              children: e.title,
                            }),
                            r.jsx('p', {
                              style: {
                                fontSize: 14,
                                color: '#6b7280',
                                marginTop: 8,
                                lineHeight: 1.5,
                              },
                              children: e.desc,
                            }),
                          ],
                        },
                        e.title,
                      ),
                    ),
                  }),
                ],
              }),
              (0, r.jsxs)('section', {
                style: {
                  padding: '80px 24px',
                  background: '#6366F1',
                  color: 'white',
                  textAlign: 'center',
                },
                children: [
                  r.jsx('h2', {
                    style: { fontSize: 32, fontWeight: 700 },
                    children: 'Start Learning Smarter Today',
                  }),
                  r.jsx('p', {
                    style: { fontSize: 16, opacity: 0.9, marginTop: 12 },
                    children: 'Free forever. No credit card required.',
                  }),
                  r.jsx('a', {
                    href: '/download',
                    style: {
                      display: 'inline-block',
                      marginTop: 32,
                      padding: '14px 40px',
                      background: 'white',
                      color: '#6366F1',
                      borderRadius: 12,
                      textDecoration: 'none',
                      fontWeight: 600,
                    },
                    children: 'Download LearnFlow',
                  }),
                ],
              }),
            ],
          });
        }
        n(6321);
      },
    }));
  var t = require('../webpack-runtime.js');
  t.C(e);
  var n = (e) => t((t.s = e)),
    r = t.X(0, [522, 679], () => n(1491));
  module.exports = r;
})();
