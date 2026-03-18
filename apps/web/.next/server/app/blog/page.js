(() => {
  var e = {};
  ((e.id = 404),
    (e.ids = [404]),
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
      1551: (e, t, r) => {
        'use strict';
        (r.r(t),
          r.d(t, {
            GlobalError: () => a.a,
            __next_app__: () => u,
            originalPathname: () => p,
            pages: () => c,
            routeModule: () => g,
            tree: () => d,
          }),
          r(4611),
          r(7718),
          r(7824));
        var o = r(3282),
          n = r(5736),
          i = r(3906),
          a = r.n(i),
          s = r(6880),
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
        r.d(t, l);
        let d = [
            '',
            {
              children: [
                'blog',
                {
                  children: [
                    '__PAGE__',
                    {},
                    {
                      page: [
                        () => Promise.resolve().then(r.bind(r, 4611)),
                        '/home/aifactory/.openclaw/workspace/learnflow/apps/web/src/app/blog/page.tsx',
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
          c = ['/home/aifactory/.openclaw/workspace/learnflow/apps/web/src/app/blog/page.tsx'],
          p = '/blog/page',
          u = { require: r, loadChunk: () => Promise.resolve() },
          g = new o.AppPageRouteModule({
            definition: {
              kind: n.x.APP_PAGE,
              page: '/blog/page',
              pathname: '/blog',
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
      4611: (e, t, r) => {
        'use strict';
        (r.r(t), r.d(t, { default: () => n }));
        var o = r(9013);
        function n() {
          return (0, o.jsxs)('div', {
            'data-page': 'blog',
            style: { maxWidth: 700, margin: '0 auto', padding: '60px 24px' },
            children: [
              o.jsx('h1', {
                style: { fontSize: 40, fontWeight: 800, marginBottom: 48 },
                children: 'Blog',
              }),
              [
                {
                  slug: 'introducing-learnflow',
                  title: 'Introducing LearnFlow: AI-Powered Learning for Everyone',
                  excerpt:
                    'Today we launch LearnFlow — a platform that uses six AI agents to create personalized courses from any topic.',
                  date: '2026-03-15',
                  author: 'LearnFlow Team',
                  readTime: '5 min',
                },
                {
                  slug: 'how-course-builder-works',
                  title: 'How the Course Builder Agent Works',
                  excerpt:
                    'A deep dive into how we use Firecrawl, credibility scoring, and LLM synthesis to generate quality courses.',
                  date: '2026-03-10',
                  author: 'Engineering Team',
                  readTime: '8 min',
                },
                {
                  slug: 'cornell-notes-ai',
                  title: 'Cornell Notes Meet AI: Smarter Study Materials',
                  excerpt:
                    'Learn how our Notes Agent generates structured study materials in multiple formats automatically.',
                  date: '2026-03-05',
                  author: 'Product Team',
                  readTime: '4 min',
                },
              ].map((e) =>
                (0, o.jsxs)(
                  'article',
                  {
                    'data-post': e.slug,
                    style: {
                      marginBottom: 48,
                      paddingBottom: 48,
                      borderBottom: '1px solid #f3f4f6',
                    },
                    children: [
                      o.jsx('time', {
                        style: { fontSize: 12, color: '#9ca3af' },
                        children: e.date,
                      }),
                      o.jsx('h2', {
                        style: { fontSize: 24, fontWeight: 700, marginTop: 8 },
                        children: o.jsx('a', {
                          href: `/blog/${e.slug}`,
                          style: { color: '#111827', textDecoration: 'none' },
                          children: e.title,
                        }),
                      }),
                      o.jsx('p', {
                        style: { fontSize: 16, color: '#4b5563', lineHeight: 1.6, marginTop: 8 },
                        children: e.excerpt,
                      }),
                      (0, o.jsxs)('div', {
                        style: { marginTop: 12, fontSize: 13, color: '#6b7280' },
                        children: [e.author, ' \xb7 ', e.readTime, ' read'],
                      }),
                    ],
                  },
                  e.slug,
                ),
              ),
              (0, o.jsxs)('section', {
                'data-component': 'mdx-render',
                style: { marginTop: 32 },
                children: [
                  o.jsx('h3', {
                    style: { fontSize: 18, marginBottom: 16 },
                    children: 'Code Example (Syntax Highlighted)',
                  }),
                  o.jsx('pre', {
                    'data-language': 'typescript',
                    style: {
                      background: '#1e1e1e',
                      color: '#d4d4d4',
                      padding: 20,
                      borderRadius: 8,
                      overflow: 'auto',
                      fontSize: 14,
                      lineHeight: 1.5,
                    },
                    children: o.jsx('code', {
                      children: `import { CourseBuilderAgent } from '@learnflow/agents';

const builder = new CourseBuilderAgent();
const course = await builder.process({
  topic: 'Quantum Computing',
  depth: 'intermediate',
  modules: 5,
});

console.log(course.syllabus);`,
                    }),
                  }),
                ],
              }),
            ],
          });
        }
        r(6321);
      },
      7718: (e, t, r) => {
        'use strict';
        (r.r(t), r.d(t, { default: () => i, metadata: () => n }));
        var o = r(9013);
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
        function i({ children: e }) {
          return (0, o.jsxs)('html', {
            lang: 'en',
            children: [
              (0, o.jsxs)('head', {
                children: [
                  o.jsx('meta', {
                    name: 'viewport',
                    content: 'width=device-width, initial-scale=1',
                  }),
                  o.jsx('link', { rel: 'icon', href: '/favicon.ico' }),
                  o.jsx('script', {
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
              (0, o.jsxs)('body', {
                style: {
                  margin: 0,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  color: '#111827',
                },
                children: [
                  (0, o.jsxs)('nav', {
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
                      o.jsx('a', {
                        href: '/',
                        style: {
                          fontWeight: 700,
                          fontSize: 20,
                          color: '#6366F1',
                          textDecoration: 'none',
                        },
                        children: 'LearnFlow',
                      }),
                      (0, o.jsxs)('div', {
                        style: { display: 'flex', gap: 24, fontSize: 14 },
                        children: [
                          o.jsx('a', { href: '/features', children: 'Features' }),
                          o.jsx('a', { href: '/pricing', children: 'Pricing' }),
                          o.jsx('a', { href: '/download', children: 'Download' }),
                          o.jsx('a', { href: '/blog', children: 'Blog' }),
                        ],
                      }),
                      o.jsx('a', {
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
                  o.jsx('main', { children: e }),
                  o.jsx('footer', {
                    style: {
                      padding: '48px 24px',
                      background: '#f9fafb',
                      borderTop: '1px solid #e5e7eb',
                      textAlign: 'center',
                      fontSize: 14,
                      color: '#6b7280',
                    },
                    children: o.jsx('p', {
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
    o = t.X(0, [522, 679], () => r(1551));
  module.exports = o;
})();
