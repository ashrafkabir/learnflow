import React, { useState } from 'react';
import { SEO } from '../components/SEO.js';
import { Button } from '../components/Button.js';

const TABS = ['Find Study Partners', 'My Groups', 'Shared Mindmaps'] as const;

export function Collaboration() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Find Study Partners');

  return (
    <section className="min-h-screen bg-bg dark:bg-bg-dark">
      <SEO title="Collaborate" description="Learn together — find study partners, join groups, and share mindmaps." path="/collaborate" />
      <div className="max-w-4xl mx-auto px-4 py-8 md:pl-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Learn Together</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Collaborate with peers to accelerate your learning.</p>

        {/* Coming soon banner */}
        <div className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/30 text-sm text-accent font-medium flex items-center gap-2">
          <span>🚀</span> Collaboration features are in active development. Early access coming soon!
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {TABS.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Tab content — empty states */}
        {activeTab === 'Find Study Partners' && (
          <div className="text-center py-16 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <span className="text-5xl block mb-4">🤝</span>
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Find Your Study Partners</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
              Our AI matches you with learners who share your topics and goals. Get paired for accountability, discussion, and peer reviews.
            </p>
            <Button variant="primary" disabled>Coming Soon</Button>
          </div>
        )}

        {activeTab === 'My Groups' && (
          <div className="text-center py-16 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <span className="text-5xl block mb-4">👥</span>
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Study Groups</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
              Create or join study groups around specific courses or topics. Set goals together and track collective progress.
            </p>
            <Button variant="primary" disabled>Coming Soon</Button>
          </div>
        )}

        {activeTab === 'Shared Mindmaps' && (
          <div className="text-center py-16 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <span className="text-5xl block mb-4">🗺️</span>
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Shared Mindmaps</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
              Collaborate on knowledge graphs in real-time. See what your peers know, identify complementary strengths, and fill gaps together.
            </p>
            <Button variant="primary" disabled>Coming Soon</Button>
          </div>
        )}
      </div>
    </section>
  );
}
