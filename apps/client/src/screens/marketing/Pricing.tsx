import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketingLayout } from './MarketingLayout.js';
import { SEO } from '../../components/SEO.js';

const PLANS = [
  {
    name: 'Free',
    monthly: 0,
    annual: 0,
    desc: 'Perfect for getting started',
    features: [
      '3 courses',
      'Basic AI agents',
      'Bring your own API keys',
      'Cornell notes & flashcards',
      'Knowledge mindmap',
      'Community support',
    ],
    missing: ['Priority AI agents', 'Managed API keys', 'Update Agent', 'Advanced analytics', 'Priority support'],
    cta: 'Get Started Free',
    highlight: false,
  },
  {
    name: 'Pro',
    monthly: 19,
    annual: 15,
    desc: 'For serious learners',
    features: [
      'Unlimited courses',
      'Priority AI agents',
      'Managed API keys',
      'Update Agent',
      'Cornell notes & flashcards',
      'Knowledge mindmap',
      'Advanced analytics',
      'Priority support',
      'Course marketplace publishing',
      'Data export',
    ],
    missing: [],
    cta: 'Start Pro Trial',
    highlight: true,
  },
];

const FAQ = [
  { q: 'Can I use my own API keys?', a: 'Yes! Bring your own OpenAI, Anthropic, or Google API keys. They\'re encrypted and never shared. Pro users get managed keys included.' },
  { q: 'What happens when I hit the course limit?', a: 'Free users can create up to 3 courses. Upgrade to Pro anytime for unlimited courses.' },
  { q: 'Is there a mobile app?', a: 'Yes! LearnFlow is available on iOS, Android, and desktop (Mac, Windows, Linux).' },
  { q: 'Can I export my data?', a: 'Pro users can export all courses, notes, and progress as JSON or Markdown at any time.' },
];

export function PricingPage() {
  const nav = useNavigate();
  const [annual, setAnnual] = useState(false);

  return (
    <MarketingLayout>
      <SEO title="Pricing" description="Simple, transparent pricing for LearnFlow. Start free, upgrade to Pro for unlimited courses and priority AI agents." path="/pricing" />
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">Start free, upgrade when you're ready.</p>
          
          {/* Annual/Monthly toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!annual ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${annual ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
            >
              Annual <span className="text-accent text-xs ml-1">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-20">
          {PLANS.map((plan) => (
            <div
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">${annual ? plan.annual : plan.monthly}</span>
                {plan.monthly > 0 && <span className="text-gray-500 dark:text-gray-400 text-sm">/month</span>}
              </div>
              <button
                onClick={() => {
                  const token = localStorage.getItem('learnflow-token');
                  if (token) {
                    // Logged in — go to dashboard or settings for upgrade
                    nav(plan.highlight ? '/settings' : '/dashboard');
                  } else {
                    nav('/register');
                  }
                }}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors mb-6 ${
                  plan.highlight
                    ? 'bg-accent text-white hover:bg-accent-dark'
                    : 'border-2 border-gray-200 dark:border-gray-700 hover:border-accent hover:text-accent'
                }`}
              >
                {(() => {
                  const token = localStorage.getItem('learnflow-token');
                  if (token && !plan.highlight) return 'Go to Dashboard';
                  if (token && plan.highlight) return 'Upgrade to Pro';
                  return plan.cta;
                })()}
              </button>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="text-accent">✓</span> {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="text-red-400 dark:text-red-500">✕</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Money-back guarantee */}
        <div className="flex justify-center mb-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">30-day money-back guarantee</p>
              <p className="text-xs text-green-700 dark:text-green-400">Not happy? Get a full refund, no questions asked.</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <details key={item.q} className="group border border-gray-200 dark:border-gray-700 rounded-xl hover:border-accent/30 transition-colors">
                <summary className="cursor-pointer p-4 font-medium text-sm flex justify-between items-center text-gray-900 dark:text-white">
                  {item.q}
                  <span className="text-gray-500 dark:text-gray-400 group-open:rotate-180 transition-transform ml-4 flex-shrink-0">▾</span>
                </summary>
                <p className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
