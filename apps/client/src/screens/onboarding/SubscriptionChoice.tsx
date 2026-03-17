import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.js';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['3 courses', 'Basic AI agents', 'Bring your own API keys', 'Community support'],
    cta: 'Start Free',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/month',
    features: [
      'Unlimited courses',
      'Priority AI agents',
      'Managed API keys',
      'Update Agent',
      'Advanced analytics',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
    highlight: true,
  },
];

export function SubscriptionChoice() {
  const nav = useNavigate();
  const { dispatch } = useApp();
  const [selected, setSelected] = useState('free');

  const next = () => {
    dispatch({ type: 'SET_ONBOARDING_STEP', step: 5 });
    nav('/onboarding/first-course');
  };

  return (
    <div
      data-screen="onboarding-subscription"
      className="min-h-screen bg-gray-50 dark:bg-bg-dark flex flex-col"
    >
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full w-5/6 bg-accent rounded-full transition-all" />
          </div>
          <span className="text-xs text-gray-400">5/6</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Choose Your Plan
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">
          Start free, upgrade anytime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                selected === plan.id
                  ? plan.highlight
                    ? 'border-accent bg-accent/5 shadow-lg'
                    : 'border-accent bg-accent/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </span>
              )}
              <p className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {plan.price}
                <span className="text-sm font-normal text-gray-400">{plan.period}</span>
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                  >
                    <span className="text-success">✓</span> {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <button
          onClick={next}
          className="w-full py-4 bg-accent text-white font-semibold rounded-xl hover:bg-accent-dark transition-colors"
        >
          Continue with {selected === 'pro' ? 'Pro' : 'Free'}
        </button>
      </div>
    </div>
  );
}
