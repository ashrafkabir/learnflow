(() => {
  var e = {};
  ((e.id = 979),
    (e.ids = [979]),
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
      3260: (e, t, a) => {
        'use strict';
        (a.r(t),
          a.d(t, {
            GlobalError: () => o.a,
            __next_app__: () => g,
            originalPathname: () => c,
            pages: () => p,
            routeModule: () => h,
            tree: () => d,
          }),
          a(2036),
          a(7718),
          a(7824));
        var r = a(3282),
          n = a(5736),
          i = a(3906),
          o = a.n(i),
          l = a(6880),
          s = {};
        for (let e in l)
          0 >
            [
              'default',
              'tree',
              'pages',
              'GlobalError',
              'originalPathname',
              '__next_app__',
              'routeModule',
            ].indexOf(e) && (s[e] = () => l[e]);
        a.d(t, s);
        let d = [
            '',
            {
              children: [
                'pricing',
                {
                  children: [
                    '__PAGE__',
                    {},
                    {
                      page: [
                        () => Promise.resolve().then(a.bind(a, 2036)),
                        '/home/aifactory/.openclaw/workspace/learnflow/apps/web/src/app/pricing/page.tsx',
                      ],
                    },
                  ],
                },
                {},
              ],
            },
            {
              layout: [
                () => Promise.resolve().then(a.bind(a, 7718)),
                '/home/aifactory/.openclaw/workspace/learnflow/apps/web/src/app/layout.tsx',
              ],
              'not-found': [
                () => Promise.resolve().then(a.t.bind(a, 7824, 23)),
                'next/dist/client/components/not-found-error',
              ],
            },
          ],
          p = ['/home/aifactory/.openclaw/workspace/learnflow/apps/web/src/app/pricing/page.tsx'],
          c = '/pricing/page',
          g = { require: a, loadChunk: () => Promise.resolve() },
          h = new r.AppPageRouteModule({
            definition: {
              kind: n.x.APP_PAGE,
              page: '/pricing/page',
              pathname: '/pricing',
              bundlePath: '',
              filename: '',
              appPaths: [],
            },
            userland: { loaderTree: d },
          });
      },
      3963: (e, t, a) => {
        (Promise.resolve().then(a.t.bind(a, 4424, 23)),
          Promise.resolve().then(a.t.bind(a, 7752, 23)),
          Promise.resolve().then(a.t.bind(a, 5275, 23)),
          Promise.resolve().then(a.t.bind(a, 9842, 23)),
          Promise.resolve().then(a.t.bind(a, 1633, 23)),
          Promise.resolve().then(a.t.bind(a, 9224, 23)));
      },
      3245: () => {},
      7718: (e, t, a) => {
        'use strict';
        (a.r(t), a.d(t, { default: () => i, metadata: () => n }));
        var r = a(9013);
        a(6321);
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
      2036: (e, t, a) => {
        'use strict';
        (a.r(t), a.d(t, { default: () => n }));
        var r = a(9013);
        function n() {
          return (0, r.jsxs)('div', {
            'data-page': 'pricing',
            style: { maxWidth: 900, margin: '0 auto', padding: '60px 24px' },
            children: [
              r.jsx('h1', {
                style: { fontSize: 40, fontWeight: 800, textAlign: 'center', marginBottom: 16 },
                children: 'Pricing',
              }),
              r.jsx('p', {
                style: { textAlign: 'center', fontSize: 18, color: '#6b7280', marginBottom: 48 },
                children: 'Start free. Upgrade when you need more.',
              }),
              r.jsx('div', {
                'data-component': 'pricing-comparison',
                'aria-label': 'Plan comparison',
                style: {
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 32,
                },
                children: [
                  {
                    name: 'Free',
                    price: '$0',
                    period: 'forever',
                    cta: 'Get Started',
                    features: [
                      { label: 'Courses', value: '3 active' },
                      { label: 'Bring Your Own API Key', value: '✓' },
                      { label: 'Notes & Flashcards', value: '✓' },
                      { label: 'Quizzes', value: '✓' },
                      { label: 'Knowledge Mindmap', value: 'Basic' },
                      { label: 'Research Agent', value: '5 searches/day' },
                      { label: 'Proactive Updates', value: '✗' },
                      { label: 'Managed API Keys', value: '✗' },
                      { label: 'Advanced Analytics', value: '✗' },
                      { label: 'Priority Support', value: '✗' },
                    ],
                  },
                  {
                    name: 'Pro',
                    price: '$20',
                    period: '/month',
                    cta: 'Start Pro Trial',
                    highlight: !0,
                    features: [
                      { label: 'Courses', value: 'Unlimited' },
                      { label: 'Bring Your Own API Key', value: '✓' },
                      { label: 'Notes & Flashcards', value: '✓' },
                      { label: 'Quizzes', value: '✓' },
                      { label: 'Knowledge Mindmap', value: 'Unlimited + Collab' },
                      { label: 'Research Agent', value: 'Unlimited' },
                      { label: 'Proactive Updates', value: '✓' },
                      { label: 'Managed API Keys', value: '✓' },
                      { label: 'Advanced Analytics', value: '✓' },
                      { label: 'Priority Support', value: '✓' },
                    ],
                  },
                ].map((e) =>
                  (0, r.jsxs)(
                    'div',
                    {
                      'data-plan': e.name.toLowerCase(),
                      style: {
                        padding: 32,
                        borderRadius: 16,
                        border: e.highlight ? '2px solid #6366F1' : '1px solid #e5e7eb',
                        background: e.highlight ? '#fafafe' : 'white',
                        position: 'relative',
                      },
                      children: [
                        e.highlight &&
                          r.jsx('span', {
                            style: {
                              position: 'absolute',
                              top: -12,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: '#6366F1',
                              color: 'white',
                              padding: '4px 16px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                            },
                            children: 'Most Popular',
                          }),
                        r.jsx('h2', { style: { fontSize: 24, fontWeight: 700 }, children: e.name }),
                        (0, r.jsxs)('div', {
                          style: { marginTop: 8 },
                          children: [
                            r.jsx('span', {
                              style: { fontSize: 48, fontWeight: 800 },
                              children: e.price,
                            }),
                            r.jsx('span', {
                              style: { fontSize: 16, color: '#6b7280' },
                              children: e.period,
                            }),
                          ],
                        }),
                        r.jsx('a', {
                          href: '/download',
                          'aria-label': e.cta,
                          style: {
                            display: 'block',
                            textAlign: 'center',
                            marginTop: 24,
                            padding: '12px 24px',
                            background: e.highlight ? '#6366F1' : '#f3f4f6',
                            color: e.highlight ? 'white' : '#374151',
                            borderRadius: 10,
                            textDecoration: 'none',
                            fontWeight: 600,
                          },
                          children: e.cta,
                        }),
                        r.jsx('ul', {
                          style: { marginTop: 32, listStyle: 'none', padding: 0 },
                          children: e.features.map((e) =>
                            (0, r.jsxs)(
                              'li',
                              {
                                style: {
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  padding: '8px 0',
                                  borderBottom: '1px solid #f3f4f6',
                                  fontSize: 14,
                                },
                                children: [
                                  r.jsx('span', { style: { color: '#374151' }, children: e.label }),
                                  r.jsx('span', {
                                    style: {
                                      color: '✗' === e.value ? '#d1d5db' : '#059669',
                                      fontWeight: 500,
                                    },
                                    children: e.value,
                                  }),
                                ],
                              },
                              e.label,
                            ),
                          ),
                        }),
                      ],
                    },
                    e.name,
                  ),
                ),
              }),
            ],
          });
        }
        a(6321);
      },
    }));
  var t = require('../../webpack-runtime.js');
  t.C(e);
  var a = (e) => t((t.s = e)),
    r = t.X(0, [522, 679], () => a(3260));
  module.exports = r;
})();
