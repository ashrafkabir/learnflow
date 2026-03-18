import React from 'react';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { Button } from '../../components/Button.js';

const PLATFORMS = [
  { icon: '🍎', name: 'macOS', req: 'Requires macOS 12 or later', formats: ['Universal (.dmg)', 'Apple Silicon (.dmg)'] },
  { icon: '🪟', name: 'Windows', req: 'Requires Windows 10 or later', formats: ['Installer (.exe)', 'Portable (.zip)'] },
  { icon: '🐧', name: 'Linux', req: 'Ubuntu 20.04+, Fedora 36+', formats: ['AppImage', '.deb package', '.rpm package'] },
  { icon: '📱', name: 'iOS', req: 'Requires iOS 16 or later', formats: ['App Store'] },
  { icon: '🤖', name: 'Android', req: 'Requires Android 12 or later', formats: ['Google Play', 'APK download'] },
];

export function DownloadPage() {
  return (
    <MarketingLayout>
      <SEO title="Download" description="Download LearnFlow on macOS, Windows, Linux, iOS, and Android. Learn anywhere, anytime." path="/download" />
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Download LearnFlow</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">Available on all major platforms. Learn anywhere, anytime.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {PLATFORMS.map((p) => (
            <div key={p.name} className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-accent/30 hover:shadow-card transition-all text-center">
              <span className="text-4xl block mb-3">{p.icon}</span>
              <h3 className="font-bold text-lg mb-1">{p.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{p.req}</p>
              <div className="space-y-2">
                {p.formats.map((f) => (
                  <Button key={f} variant="primary" fullWidth size="sm">
                    {f}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center p-8 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-lg mb-2">Or use the web version</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No download required. Works in any modern browser.</p>
          <a href="/register" className="inline-block px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors">
            Open Web App
          </a>
        </div>
      </section>
    </MarketingLayout>
  );
}
