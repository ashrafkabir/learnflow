import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.js';
import { OnboardingProgress } from '../../components/OnboardingProgress.js';
import { Button } from '../../components/Button.js';

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
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');

  const next = () => {
    if (selected === 'pro') {
      setShowModal(true);
      return;
    }
    dispatch({ type: 'SET_ONBOARDING_STEP', step: 5 });
    nav('/onboarding/first-course');
  };

  const continueAfterModal = () => {
    setShowModal(false);
    dispatch({ type: 'SET_ONBOARDING_STEP', step: 5 });
    nav('/onboarding/first-course');
  };

  return (
    <div
      data-screen="onboarding-subscription"
      className="slide-in-right min-h-screen bg-gray-50 dark:bg-bg-dark flex flex-col"
    >
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full w-5/6 bg-accent rounded-full transition-all" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-300">5/6</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6 max-w-2xl mx-auto w-full">
        <OnboardingProgress current="subscription" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Choose Your Plan
        </h1>
        <p className="text-gray-500 dark:text-gray-300 mb-8 text-center">
          Start free, upgrade anytime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {PLANS.map((plan) => (
            <Button
              key={plan.id}
              variant="ghost"
              onClick={() => setSelected(plan.id)}
              className={`relative p-6 rounded-2xl border-2 text-left h-auto items-start transition-all ${
                selected === plan.id
                  ? plan.highlight
                    ? 'border-accent bg-accent/5 shadow-card'
                    : 'border-accent bg-accent/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </span>
              )}
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {plan.price}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-300">
                    {plan.period}
                  </span>
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"
                    >
                      <span className="text-success">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Button>
          ))}
        </div>

        <div className="flex gap-3 items-center">
          <Button
            variant="secondary"
            onClick={() => nav('/onboarding/api-keys')}
            className="px-6 py-4"
          >
            Back
          </Button>
          <Button variant="primary" fullWidth onClick={next} className="py-4">
            Continue with {selected === 'pro' ? 'Pro' : 'Free'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              dispatch({ type: 'SET_ONBOARDING_STEP', step: 5 });
              nav('/onboarding/first-course');
            }}
          >
            Skip
          </Button>
        </div>
      </div>

      {/* Pro upgrade modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Pro Coming Soon!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
                Payment integration is being finalized. Leave your email and we'll notify you when
                Pro is ready.
              </p>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" fullWidth onClick={continueAfterModal}>
                {email ? 'Notify Me & Continue' : 'Continue with Free'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
