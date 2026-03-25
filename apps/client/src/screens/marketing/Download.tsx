import React, { useEffect, useState } from 'react';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { Button } from '../../components/Button.js';
import { motion } from 'framer-motion';
import { IconSparkles } from '../../components/icons/index.js';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const PLATFORMS = [
  {
    icon: <IconSparkles className="w-7 h-7" />,
    name: 'Web (recommended)',
    key: 'web',
    req: 'Works in any modern browser',
    formats: ['Open Web App'],
  },
];

function detectOS(): string {
  // Web-first MVP: always recommend the browser app.
  return 'web';
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
        description="Use LearnFlow in your browser. This web-first MVP requires no installation; native apps may be offered in a future release."
        path="/download"
      />
      <section className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Get LearnFlow</h1>
          <p className="text-lg text-gray-500 dark:text-gray-300">
            LearnFlow is a web-first MVP. Use it in your browser — no installation required.
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
            <Button
              variant="primary"
              size="large"
              onClick={() => (window.location.href = '/register')}
            >
              Open LearnFlow in your browser
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
              Web-first MVP — works everywhere
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
                    onClick={() => (window.location.href = '/register')}
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center p-8 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-lg mb-2">Use the web app</h3>
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
            No download required. Works in any modern browser. Native apps may be offered in a
            future release.
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
