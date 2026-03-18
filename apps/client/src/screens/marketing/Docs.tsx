import React, { useState } from 'react';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { Button } from '../../components/Button.js';

const SECTIONS = [
  {
    category: 'Getting Started',
    items: [
      { title: 'Installation', content: 'Download LearnFlow for your platform from the Download page. Available on macOS, Windows, Linux, iOS, and Android. The web version requires no installation.' },
      { title: 'Creating Your First Course', content: 'After onboarding, click "New Course" from the Dashboard or type a topic in the Conversation screen. Our AI agents will research, curate, and build a structured course for you.' },
      { title: 'Configuring API Keys', content: 'Go to Settings → API Vault to add your own OpenAI, Anthropic, or Google API keys. Keys are encrypted locally and never shared. Pro users get managed keys included.' },
    ],
  },
  {
    category: 'User Guide',
    items: [
      { title: 'Dashboard Overview', content: 'The Dashboard shows your active courses, learning streaks, and quick actions. Use the sidebar to navigate to Conversation, Mind Map, Marketplace, and Settings.' },
      { title: 'AI Conversation', content: 'Chat with specialized AI agents. Ask questions, request research summaries, or create new courses — all through natural conversation with inline citations.' },
      { title: 'Knowledge Mindmap', content: 'Visualize your knowledge graph. Nodes are color-coded by mastery level. Click to expand, jump to lessons, or add connections. Use keyboard navigation for accessibility.' },
    ],
  },
  {
    category: 'Agent SDK',
    items: [
      { title: 'Agent Architecture', content: 'LearnFlow uses a multi-agent pipeline: Curriculum Agent, Research Agent, Content Agent, Exam Agent, and Collaboration Agent. Each handles a specific phase of course creation.' },
      { title: 'Creating Custom Agents', content: 'Coming soon — the Agent SDK will let you build and publish custom AI agents to the marketplace.' },
    ],
  },
  {
    category: 'API Reference',
    items: [
      { title: 'REST API', content: 'The LearnFlow REST API provides programmatic access to courses, lessons, notes, and user data. Full API documentation coming soon.' },
      { title: 'WebSocket Events', content: 'Real-time events for course generation progress, agent status, and collaboration features. Documentation coming soon.' },
    ],
  },
  {
    category: 'Creator Guide',
    items: [
      { title: 'Publishing Courses', content: 'Create courses and publish them to the marketplace for the community. Set pricing, add descriptions, and track analytics from the Creator Dashboard.' },
      { title: 'Earning Revenue', content: 'Pro creators earn revenue from paid course sales. Stripe integration for payouts coming soon.' },
    ],
  },
];

export function DocsPage() {
  const [activeCategory, setActiveCategory] = useState('Getting Started');
  const [activeItem, setActiveItem] = useState(0);
  const section = SECTIONS.find((s) => s.category === activeCategory)!;

  return (
    <MarketingLayout>
      <SEO title="Documentation" description="LearnFlow documentation — getting started, user guide, agent SDK, API reference, and creator guide." path="/docs" />
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Documentation</h1>
          <p className="text-gray-600 dark:text-gray-300">Everything you need to get the most out of LearnFlow.</p>
        </div>

        {/* Search (non-functional stub) */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search docs..."
            className="w-full max-w-md px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Search documentation"
          />
        </div>

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
                  onClick={() => { setActiveCategory(s.category); setActiveItem(0); }}
                  className={`justify-start text-sm font-medium ${activeCategory === s.category ? 'bg-accent/10 text-accent' : 'text-gray-600 dark:text-gray-300'}`}
                  aria-current={activeCategory === s.category ? 'page' : undefined}
                >
                  {s.category}
                </Button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
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
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{section.items[activeItem].content}</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
