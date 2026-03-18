import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';

const SUGGESTED_LINKS = [
  { label: '📊 Dashboard', path: '/dashboard' },
  { label: '💬 Conversation', path: '/conversation' },
  { label: '🛒 Marketplace', path: '/marketplace' },
  { label: '🧠 Mindmap', path: '/mindmap' },
  { label: '⚙️ Settings', path: '/settings' },
];

export function NotFound() {
  const nav = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      nav(`/marketplace?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-4">
      {/* 404 Illustration */}
      <div className="text-center mb-8">
        <div className="text-8xl mb-4" aria-hidden="true">🗺️</div>
        <div className="text-9xl font-black text-accent/20 select-none mb-2">404</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Page not found</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          The page you're looking for doesn't exist or has been moved. Try searching or pick one of the links below.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="w-full max-w-md mb-8">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for courses, topics..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
          />
        </div>
      </form>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-10">
        <Button onClick={() => nav('/')} variant="secondary">Go Home</Button>
        <Button onClick={() => nav('/dashboard')}>Go to Dashboard</Button>
      </div>

      {/* Suggested Links */}
      <div className="text-center">
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">Or try one of these:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTED_LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => nav(link.path)}
              className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-accent/10 hover:text-accent transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
