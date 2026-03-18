import React, { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/Button.js';

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
          <Button variant="ghost" onClick={() => nav('/')} className="flex items-center gap-2 font-bold text-xl p-0 h-auto">
            <span className="text-2xl">🧠</span>
            <span>LearnFlow</span>
          </Button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <Button
                key={l.href}
                variant="ghost"
                size="sm"
                onClick={() => nav(l.href)}
                className={`text-sm font-medium ${
                  location.pathname === l.href
                    ? 'text-accent'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {l.label}
              </Button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => nav('/login')}>
              Sign In
            </Button>
            <Button variant="primary" size="sm" onClick={() => nav('/register')}>
              Get Started
            </Button>
          </div>

          {/* Mobile hamburger */}
          <Button variant="ghost" size="icon" className="md:hidden text-2xl" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? '✕' : '☰'}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-4 space-y-3">
            {NAV_LINKS.map((l) => (
              <Button
                key={l.href}
                variant="ghost"
                fullWidth
                onClick={() => { nav(l.href); setMobileOpen(false); }}
                className="justify-start text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {l.label}
              </Button>
            ))}
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => nav('/login')}>Sign In</Button>
              <Button variant="primary" size="sm" onClick={() => nav('/register')}>Get Started</Button>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Product</h3>
              <div className="space-y-2">
                {['Features', 'Pricing', 'Download', 'Changelog'].map((t) => (
                  <Button key={t} variant="ghost" size="sm" onClick={() => nav(`/${t.toLowerCase()}`)} className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-0 h-auto">{t}</Button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Resources</h3>
              <div className="space-y-2">
                {['Blog', 'Documentation', 'API Reference', 'Community'].map((t) => (
                  <Button key={t} variant="ghost" size="sm" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-0 h-auto">{t}</Button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Company</h3>
              <div className="space-y-2">
                {['About', 'Careers', 'Privacy', 'Terms'].map((t) => (
                  <Button key={t} variant="ghost" size="sm" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-0 h-auto">{t}</Button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">Connect</h3>
              <div className="space-y-2">
                {['Twitter', 'Discord', 'GitHub', 'YouTube'].map((t) => (
                  <Button key={t} variant="ghost" size="sm" className="block text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-0 h-auto">{t}</Button>
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
              <Button variant="ghost" size="sm" className="p-0 h-auto hover:text-gray-900 dark:hover:text-gray-300">Privacy</Button>
              <Button variant="ghost" size="sm" className="p-0 h-auto hover:text-gray-900 dark:hover:text-gray-300">Terms</Button>
              <Button variant="ghost" size="sm" className="p-0 h-auto hover:text-gray-900 dark:hover:text-gray-300">Cookies</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
