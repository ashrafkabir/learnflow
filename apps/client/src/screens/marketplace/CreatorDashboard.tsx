import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button.js';

const TABS = ['My Courses', 'Analytics', 'Earnings'] as const;
type Tab = (typeof TABS)[number];

const EMPTY_STATES: Record<Tab, { icon: string; title: string; desc: string }> = {
  'My Courses': { icon: '📚', title: 'No courses yet', desc: 'Publish your first course to see it here.' },
  Analytics: { icon: '📊', title: 'No analytics yet', desc: 'Publish your first course to see analytics here.' },
  Earnings: { icon: '💰', title: 'No earnings yet', desc: 'Start earning by publishing popular courses.' },
};

/** Spec §7.1 — Creator Dashboard stub */
export function CreatorDashboard() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('My Courses');
  const empty = EMPTY_STATES[tab];

  return (
    <section aria-label="Creator Dashboard" data-screen="creator-dashboard" className="min-h-screen bg-bg dark:bg-bg-dark">
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => nav('/marketplace')}>←</Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">🎨 Creator Dashboard</h1>
          <div className="ml-auto">
            <Button variant="primary" onClick={() => nav('/conversation')}>+ Create Course</Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <nav className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1" aria-label="Creator tabs">
          {TABS.map((t) => (
            <Button
              key={t}
              variant={tab === t ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTab(t)}
              className={`flex-1 ${tab === t ? '' : 'text-gray-600 dark:text-gray-300'}`}
            >
              {t}
            </Button>
          ))}
        </nav>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <span className="text-5xl">{empty.icon}</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{empty.title}</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-sm">{empty.desc}</p>
          {tab === 'My Courses' && (
            <Button variant="primary" onClick={() => nav('/conversation')}>Create Your First Course</Button>
          )}
        </div>
      </div>
    </section>
  );
}
