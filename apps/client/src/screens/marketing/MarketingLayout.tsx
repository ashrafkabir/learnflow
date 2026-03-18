import React, { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Download', href: '/download' },
  { label: 'Blog', href: '/blog' },
];

export function MarketingLayout({ children }: { children: ReactNode }) {
  const nav = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => nav('/')} className="flex items-center gap-2 font-bold text-xl">
            <span className="text-2xl">🧠</span>
            <span>LearnFlow</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => nav(l.href)}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === l.href
                    ? 'text-accent'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => nav('/login')}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => nav('/register')}
              className="text-sm font-medium px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
            >
              Get Started
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-2xl" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-4 space-y-3">
            {NAV_LINKS.map((l) => (
              <button
                key={l.href}
                onClick={() => { nav(l.href); setMobileOpen(false); }}
                className="block w-full text-left text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white py-2"
              >
                {l.label}
              </button>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => nav('/login')} className="text-sm font-medium text-gray-600 dark:text-gray-400">Sign In</button>
              <button onClick={() => nav('/register')} className="text-sm font-medium px-4 py-2 bg-accent text-white rounded-lg">Get Started</button>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      {children}

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Product</h3>
              <div className="space-y-2">
                {['Features', 'Pricing', 'Download', 'Changelog'].map((t) => (
                  <button key={t} onClick={() => nav(`/${t.toLowerCase()}`)} className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{t}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Resources</h3>
              <div className="space-y-2">
                {['Blog', 'Documentation', 'API Reference', 'Community'].map((t) => (
                  <button key={t} className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{t}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Company</h3>
              <div className="space-y-2">
                {['About', 'Careers', 'Privacy', 'Terms'].map((t) => (
                  <button key={t} className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{t}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Connect</h3>
              <div className="space-y-2">
                {['Twitter', 'Discord', 'GitHub', 'YouTube'].map((t) => (
                  <button key={t} className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{t}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>🧠</span>
              <span>© {new Date().getFullYear()} LearnFlow. All rights reserved.</span>
            </div>
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
              <button className="hover:text-gray-900 dark:hover:text-gray-300">Privacy</button>
              <button className="hover:text-gray-900 dark:hover:text-gray-300">Terms</button>
              <button className="hover:text-gray-900 dark:hover:text-gray-300">Cookies</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
