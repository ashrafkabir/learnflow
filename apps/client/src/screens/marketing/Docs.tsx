import React, { useState } from 'react';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { Button } from '../../components/Button.js';
import { IconZap } from '../../components/icons/index.js';

const SECTIONS = [
  {
    category: 'Getting Started',
    items: [
      {
        title: 'Installation',
        content:
          'LearnFlow is a web-first MVP that runs in any modern browser. No installation required. Native iOS/Android and desktop apps may be offered in a future release.',
      },
      {
        title: 'Creating Your First Course',
        content:
          'After onboarding, click "New Course" from the Dashboard or type a topic in the Conversation screen. Our AI agents will research, curate, and build a structured course for you.',
      },
      {
        title: 'Configuring API Keys',
        content:
          'Go to Settings → API Vault to add your own OpenAI, Anthropic, or Google API keys. Keys are encrypted at rest. This build is BYOAI-only (no managed keys).',
      },
    ],
  },
  {
    category: 'User Guide',
    items: [
      {
        title: 'Dashboard Overview',
        content:
          'The Dashboard shows your active courses, learning streaks, and quick actions. Use the sidebar to navigate to Conversation, Mind Map, Marketplace, and Settings. The "Today\'s Lessons" queue surfaces your most relevant next steps based on spaced repetition and course progress.',
      },
      {
        title: 'AI Conversation',
        content:
          'Chat with specialized AI agents. Ask questions, request research summaries, or create new courses — all through natural conversation with inline citations. Use quick-action chips (Take Notes, Quiz Me, Go Deeper, See Sources) after each assistant response for one-tap workflows.',
      },
      {
        title: 'Knowledge Mindmap',
        content:
          'Visualize your knowledge graph. Nodes are color-coded by mastery level: green (mastered), amber (in progress), gray (not started). Click to expand, jump to lessons, or add connections. Use keyboard navigation for accessibility. Press "?" for keyboard shortcuts.',
      },
      {
        title: 'Lesson Reader',
        content:
          'Each lesson renders with rich formatting: LaTeX equations, syntax-highlighted code blocks, and markdown. Swipe between lessons on mobile. Use flashcards at the bottom of each lesson to test recall, and earn confetti celebrations on completion.',
      },
      {
        title: 'Profile & Settings',
        content:
          'Configure your API keys in the secure API Vault, toggle dark mode, manage notification preferences, and export your data in Markdown or JSON format. API keys are encrypted at rest on the server (AES-256-GCM, AEAD).',
      },
      {
        title: 'Collaboration',
        content:
          'Find study partners by selecting interest tags. Create or join study groups around specific topics. Real-time mindmap collaboration is available in the MVP (live sync via Yjs); real-time chat and richer collaboration features are planned.',
      },
    ],
  },
  {
    category: 'Agent SDK',
    items: [
      {
        title: 'Agent Architecture',
        content:
          'LearnFlow uses a multi-agent pipeline: Curriculum Agent, Research Agent, Content Agent, Exam Agent, and Collaboration Agent. Each handles a specific phase of course creation.',
      },
      {
        title: 'Creating Custom Agents',
        content:
          'LearnFlow includes an Agent SDK (see docs repo) that defines routing, actions, and schemas. You can prototype custom agents locally and (in future) publish them to the marketplace.',
      },
      {
        title: 'API + Agent SDK (MDX docs)',
        content:
          'The full developer docs live under apps/docs as Markdown pages: API reference, agent SDK guide, and architecture notes. See: /docs/pages/api-reference.md, /docs/pages/agent-sdk.md, /docs/pages/architecture.md.',
      },
    ],
  },
  {
    category: 'API Reference',
    items: [
      {
        title: 'REST API',
        content:
          'See apps/docs/pages/api-reference.md for endpoint-by-endpoint reference (auth, keys, courses, analytics, marketplace, subscription). For Update Agent scheduling, see apps/docs/pages/update-agent-scheduling.md. For the Notifications trust-loop relationship, see apps/docs/pages/notifications-scheduling.md.',
      },
      {
        title: 'WebSocket Events',
        content:
          'LearnFlow uses a WebSocket at /ws for response streaming, agent activity, and mindmap updates. For the current MVP contract (event names + payload shapes), see apps/docs/pages/websocket-events.md.',
      },
    ],
  },
  {
    category: 'Creator Guide',
    items: [
      {
        title: 'Publishing Courses',
        content:
          'Create courses and publish them to the marketplace for the community. Set pricing, add descriptions, and track analytics from the Creator Dashboard.',
      },
      {
        title: 'Earning Revenue',
        content:
          'Paid course checkout is currently a mock flow for MVP/testing. Stripe payouts/integration are planned for a future release.',
      },
      {
        title: 'Course Analytics',
        content:
          'Track enrollments, completion rates, ratings, and revenue from the Creator Dashboard. See which modules have the highest drop-off and optimize your content accordingly.',
      },
    ],
  },
  {
    category: 'Troubleshooting',
    items: [
      {
        title: 'Common Issues',
        content:
          'Course generation stuck? Try refreshing the page or checking your API key configuration. If generation fails, ensure your API key has sufficient credits and the provider is not rate-limiting your requests.',
      },
      {
        title: 'API Key Errors',
        content:
          'If you see "Invalid API Key" errors, go to Settings → API Vault and re-enter your key. Ensure you\'re using the correct provider (OpenAI, Anthropic, or Google). Keys are validated on save.',
      },
      {
        title: 'Performance Tips',
        content:
          'For best performance: use Chrome or Firefox, enable hardware acceleration, close unused tabs during course generation, and ensure a stable internet connection for real-time features.',
      },
      {
        title: 'Contact Support',
        content:
          "Can't find what you need? Email support@learnflow.ai or join our Discord community at discord.gg/learnflow for real-time help from the team and community.",
      },
    ],
  },
];

const QUICK_START_STEPS = [
  {
    step: 1,
    title: 'Open the Web App',
    desc: 'LearnFlow is a web-first MVP. Open it in your browser — no installation required.',
  },
  {
    step: 2,
    title: 'Create an Account',
    desc: 'Sign up with email and password. Social sign-in (OAuth) is not available in this MVP.',
  },
  {
    step: 3,
    title: 'Add Your API Key',
    desc: 'Go to Settings → API Vault and add your OpenAI, Anthropic, or Google API key. Keys are encrypted at rest on the server.',
  },
  {
    step: 4,
    title: 'Create Your First Course',
    desc: 'Type any topic in the Conversation screen — "Learn Rust" or "Quantum Mechanics 101." AI agents build your course.',
  },
  {
    step: 5,
    title: 'Start Learning',
    desc: 'Read lessons, take quizzes, build your mindmap, and track your progress on the Dashboard.',
  },
];

export function DocsPage() {
  const [activeCategory, setActiveCategory] = useState('Getting Started');
  const [activeItem, setActiveItem] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const section = SECTIONS.find((s) => s.category === activeCategory)!;

  // Filter sections by search query
  const filteredSections = searchQuery.trim()
    ? SECTIONS.map((s) => ({
        ...s,
        items: s.items.filter(
          (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.content.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      })).filter((s) => s.items.length > 0)
    : null;

  return (
    <MarketingLayout>
      <SEO
        title="Documentation"
        description="LearnFlow documentation — getting started, user guide, agent SDK, API reference, and creator guide."
        path="/docs"
      />
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Documentation</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Everything you need to get the most out of LearnFlow.
          </p>

          <div className="mt-4 max-w-3xl">
            <div className="rounded-2xl border border-amber-200/70 dark:border-amber-400/30 bg-amber-50/70 dark:bg-amber-950/30 px-5 py-4">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                Platform availability (this build)
              </p>
              <p className="text-sm text-amber-900/90 dark:text-amber-100/90">
                This deployment ships the web app. Native iOS/Android and desktop apps are planned
                for a future release.
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search docs..."
            className="w-full max-w-md px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Search documentation"
          />
        </div>

        {/* Search results */}
        {filteredSections ? (
          <div className="space-y-6 mb-8">
            {filteredSections.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
                No results found for &ldquo;{searchQuery}&rdquo;
              </p>
            ) : (
              filteredSections.map((s) => (
                <div key={s.category}>
                  <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    {s.category}
                  </h3>
                  {s.items.map((item) => (
                    <button
                      key={item.title}
                      onClick={() => {
                        setActiveCategory(s.category);
                        const idx = SECTIONS.find(
                          (sec) => sec.category === s.category,
                        )!.items.findIndex((i) => i.title === item.title);
                        setActiveItem(idx);
                        setSearchQuery('');
                      }}
                      className="block w-full text-left p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-accent/30 mb-2 transition-colors"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                        {item.content}
                      </p>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <nav className="md:w-56 flex-shrink-0" aria-label="Documentation sections">
              <div className="space-y-1">
                {SECTIONS.map((s) => (
                  <Button
                    key={s.category}
                    variant="ghost"
                    fullWidth
                    size="sm"
                    onClick={() => {
                      setActiveCategory(s.category);
                      setActiveItem(0);
                    }}
                    className={`justify-start text-sm font-medium ${
                      activeCategory === s.category
                        ? 'bg-accent/10 text-accent'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                    aria-current={activeCategory === s.category ? 'page' : undefined}
                  >
                    {s.category}
                  </Button>
                ))}
              </div>
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Quick start walkthrough for Getting Started */}
              {activeCategory === 'Getting Started' && activeItem === 0 && (
                <div className="mb-8 p-6 rounded-2xl bg-accent/5 border border-accent/20">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                    <span className="inline-flex items-center gap-2">
                      <IconZap className="w-5 h-5 text-accent" />
                      Quick Start (5 steps)
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {QUICK_START_STEPS.map((qs) => (
                      <div key={qs.step} className="flex gap-3 items-start">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center">
                          {qs.step}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {qs.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{qs.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mb-6 flex-wrap">
                {section.items.map((item, i) => (
                  <Button
                    key={item.title}
                    variant={i === activeItem ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveItem(i)}
                  >
                    {item.title}
                  </Button>
                ))}
              </div>
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-6 bg-white dark:bg-gray-900">
                <h2 className="text-xl font-bold mb-4">{section.items[activeItem].title}</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {section.items[activeItem].content}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </MarketingLayout>
  );
}
