import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './Button.js';
import {
  IconBrainSpark,
  IconChart,
  IconChat,
  IconClose,
  IconHandshake,
  IconMarketplace,
  IconMenu,
  IconMindmap,
  IconSettings,
  IconSpark,
} from './icons/index.js';

const NAV_ITEMS = [
  { icon: IconChart, label: 'Dashboard', path: '/dashboard' },
  { icon: IconChat, label: 'Conversation', path: '/conversation' },
  { icon: IconMindmap, label: 'Mind Map', path: '/mindmap' },
  { icon: IconHandshake, label: 'Collaborate', path: '/collaborate' },
  { icon: IconMarketplace, label: 'Marketplace', path: '/marketplace' },
  { icon: IconMarketplace, label: 'Creator', path: '/marketplace/creator' },
  { icon: IconSpark, label: 'Notifications', path: '/notifications' },
  { icon: IconSettings, label: 'Settings', path: '/settings' },
];

/** Mobile-responsive hamburger nav for authenticated app screens */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <div className="fixed top-3 left-3 z-50 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-card"
        >
          <IconMenu size={20} className="text-gray-800 dark:text-gray-100" title="Menu" />
        </Button>
      </div>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Slide-out drawer */}
      <nav
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-200 md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="App navigation"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <span className="font-bold text-lg flex items-center gap-2">
            <IconBrainSpark size={20} className="text-accent" title="LearnFlow" />
            LearnFlow
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <IconClose size={18} className="text-gray-700 dark:text-gray-200" title="Close" />
          </Button>
        </div>
        <div className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Button
                key={item.path}
                variant="ghost"
                fullWidth
                onClick={() => {
                  nav(item.path);
                  setOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    nav(item.path);
                    setOpen(false);
                  }
                }}
                tabIndex={0}
                aria-current={active ? 'page' : undefined}
                className={`justify-start gap-3 text-sm font-medium py-3 ${
                  active ? 'bg-accent/10 text-accent' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <Icon
                  size={18}
                  className={active ? 'text-accent' : 'text-gray-500 dark:text-gray-300'}
                  decorative
                />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
