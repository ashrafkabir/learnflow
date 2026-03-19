import React, { useEffect, useState } from 'react';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { Button } from '../../components/Button.js';
import { motion } from 'framer-motion';
import {
  IconRobot,
  IconApple,
  IconLinux,
  IconSparkles,
  IconWindows,
} from '../../components/icons/index.js';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const PLATFORMS = [
  {
    icon: <IconApple className="w-7 h-7" />,
    name: 'macOS',
    key: 'mac',
    req: 'Requires macOS 12 or later',
    formats: ['Universal (.dmg)', 'Apple Silicon (.dmg)'],
  },
  {
    icon: <IconWindows className="w-7 h-7" />,
    name: 'Windows',
    key: 'windows',
    req: 'Requires Windows 10 or later',
    formats: ['Installer (.exe)', 'Portable (.zip)'],
  },
  {
    icon: <IconLinux className="w-7 h-7" />,
    name: 'Linux',
    key: 'linux',
    req: 'Ubuntu 20.04+, Fedora 36+',
    formats: ['AppImage', '.deb package', '.rpm package'],
  },
  {
    icon: <IconApple className="w-7 h-7" />,
    name: 'iOS',
    key: 'ios',
    req: 'Requires iOS 16 or later',
    formats: ['App Store'],
  },
  {
    icon: <IconRobot className="w-7 h-7" />,
    name: 'Android',
    key: 'android',
    req: 'Requires Android 12 or later',
    formats: ['Google Play', 'APK download'],
  },
];

function detectOS(): string {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/mac/.test(platform) || /macintosh/.test(ua)) return 'mac';
  if (/win/.test(platform) || /windows/.test(ua)) return 'windows';
  if (/linux/.test(platform) || /linux/.test(ua)) return 'linux';
  return '';
}

export function DownloadPage() {
  const [recommended, setRecommended] = useState('');

  useEffect(() => {
    setRecommended(detectOS());
  }, []);

  const recommendedPlatform = PLATFORMS.find((p) => p.key === recommended);

  return (
    <MarketingLayout>
      <SEO
        title="Download"
        description="Download LearnFlow on macOS, Windows, Linux, iOS, and Android. Learn anywhere, anytime."
        path="/download"
      />
      <section className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Download LearnFlow</h1>
          <p className="text-lg text-gray-500 dark:text-gray-300">
            Available on all major platforms. Learn anywhere, anytime.
          </p>
        </motion.div>

        {/* Recommended platform CTA */}
        {recommendedPlatform && (
          <motion.div
            className="mb-10 text-center"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <Button variant="primary" size="large">
              Download for {recommendedPlatform.name}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
              Auto-detected based on your device
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {PLATFORMS.map((p) => (
            <motion.div
              key={p.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className={`p-6 rounded-2xl border-2 transition-all text-center ${
                p.key === recommended
                  ? 'border-accent shadow-xl shadow-accent/10'
                  : 'border-gray-100 dark:border-gray-800 hover:border-accent/30 hover:shadow-card'
              }`}
            >
              {p.key === recommended && (
                <span className="inline-block mb-2 text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">
                  <span className="inline-flex items-center gap-2">
                    <IconSparkles className="w-4 h-4" />
                    Recommended for you
                  </span>
                </span>
              )}
              <span className="text-accent block mb-3 inline-flex justify-center">{p.icon}</span>
              <h3 className="font-bold text-lg mb-1">{p.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-300 mb-4">{p.req}</p>
              <div className="space-y-2">
                {p.formats.map((f) => (
                  <Button
                    key={f}
                    variant={p.key === recommended ? 'primary' : 'secondary'}
                    fullWidth
                    size="sm"
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center p-8 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-lg mb-2">Or use the web version</h3>
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
            No download required. Works in any modern browser.
          </p>
          <a
            href="/register"
            className="inline-block px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors"
          >
            Open Web App
          </a>
        </div>
      </section>
    </MarketingLayout>
  );
}
