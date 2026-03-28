import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';
import { Button } from '../../components/Button.js';
import { apiPost } from '../../context/AppContext.js';
import { motion } from 'framer-motion';
import { IconCheck, IconShield, IconX } from '../../components/icons/index.js';
import { CAPABILITY_MATRIX } from '../../lib/capabilities.js';

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

const PLANS = [
  {
    name: CAPABILITY_MATRIX.free.label,
    monthly: CAPABILITY_MATRIX.free.priceMonthlyUsd,
    annual: CAPABILITY_MATRIX.free.priceAnnualUsd,
    desc: CAPABILITY_MATRIX.free.tagline,
    features: CAPABILITY_MATRIX.free.features,
    missing: CAPABILITY_MATRIX.free.missing || [],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: CAPABILITY_MATRIX.pro.label,
    monthly: CAPABILITY_MATRIX.pro.priceMonthlyUsd,
    annual: CAPABILITY_MATRIX.pro.priceAnnualUsd,
    desc: CAPABILITY_MATRIX.pro.tagline,
    features: CAPABILITY_MATRIX.pro.features,
    missing: CAPABILITY_MATRIX.pro.missing || [],
    cta: 'Enable Pro (Mock billing)',
    highlight: true,
  },
];

const FAQ = [
  {
    q: 'Can I use my own API keys?',
    a: "Yes! Bring your own OpenAI, Anthropic, or Google API keys. They're encrypted and never shared. This build is BYOAI-only (no managed keys).",
  },
  {
    q: 'What happens when I hit the course limit?',
    a: 'Free users can create up to 3 courses. Upgrade to Pro anytime for unlimited courses.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'Not yet. LearnFlow is a web-first MVP that runs in any modern browser. Native iOS/Android and desktop apps may be offered in a future release.',
  },
  {
    q: 'Can I export my data?',
    a: 'Pro users can export all courses, notes, and progress as JSON or Markdown at any time.',
  },
];

export function PricingPage() {
  const nav = useNavigate();
  const [annual, setAnnual] = useState(false);

  return (
    <MarketingLayout>
      <SEO
        title="Pricing"
        description="Simple, transparent pricing for LearnFlow. Start free, upgrade to Pro for unlimited courses and priority AI agents."
        path="/pricing"
      />
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Start free, upgrade when you're ready.
          </p>

          <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnnual(false)}
              className={`rounded-full ${!annual ? 'bg-white dark:bg-gray-700 shadow-card' : 'text-gray-500'}`}
            >
              Monthly
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnnual(true)}
              className={`rounded-full ${annual ? 'bg-white dark:bg-gray-700 shadow-card' : 'text-gray-500'}`}
            >
              Annual <span className="text-accent text-xs ml-1">Save 20%</span>
            </Button>
          </div>
        </div>

        <div
          role="note"
          aria-label="Billing note"
          className="max-w-3xl mx-auto mb-10 rounded-xl border border-green-200 bg-green-50 text-green-900 px-4 py-3 text-sm"
        >
          <strong>Billing is MVP/mock in this build.</strong> Upgrading does not perform real
          charges or refunds in this deployment.
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          {PLANS.map((plan) => (
            <motion.div
              variants={scaleIn}
              key={plan.name}
              className={`relative rounded-2xl p-8 border-2 ${
                plan.highlight
                  ? 'border-accent shadow-xl shadow-accent/10'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              )}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">${annual ? plan.annual : plan.monthly}</span>
                {plan.monthly > 0 && (
                  <span className="text-gray-500 dark:text-gray-300 text-sm">/month</span>
                )}
              </div>
              <Button
                variant={plan.highlight ? 'primary' : 'secondary'}
                fullWidth
                onClick={async () => {
                  const token = localStorage.getItem('learnflow-token');
                  if (!token) {
                    nav('/register');
                    return;
                  }

                  if (!plan.highlight) {
                    nav('/dashboard');
                    return;
                  }

                  // Pro: call API to subscribe (sandbox). Then route to settings.
                  try {
                    await apiPost('/subscription', { action: 'upgrade', plan: 'pro' });
                    nav('/settings');
                  } catch {
                    // If upgrade fails, do NOT set local subscription state.
                    nav('/settings');
                  }
                }}
                className="mb-6"
              >
                {(() => {
                  const token = localStorage.getItem('learnflow-token');
                  if (token && !plan.highlight) return 'Go to Dashboard';
                  if (token && plan.highlight) return 'Upgrade to Pro';
                  return plan.cta;
                })()}
              </Button>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="text-accent inline-flex items-center">
                      <IconCheck className="w-4 h-4" />
                    </span>
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300"
                  >
                    <span className="text-red-400 dark:text-red-500 inline-flex items-center">
                      <IconX className="w-4 h-4" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Billing note (MVP honesty) */}
        <div className="flex justify-center mb-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40">
            <span className="text-green-700 dark:text-green-300 inline-flex items-center">
              <IconShield className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                Billing is deployment-dependent (MVP)
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">
                LearnFlow&apos;s checkout/refunds are not fully implemented in this build.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group border border-gray-200 dark:border-gray-700 rounded-xl hover:border-accent/30 transition-colors"
              >
                <summary className="cursor-pointer p-4 font-medium text-sm flex justify-between items-center text-gray-900 dark:text-white">
                  {item.q}
                  <span className="text-gray-500 dark:text-gray-300 group-open:rotate-180 transition-transform ml-4 flex-shrink-0">
                    ▾
                  </span>
                </summary>
                <p className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
