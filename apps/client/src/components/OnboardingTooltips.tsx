import React, { useState, useEffect } from 'react';
import { Button } from './Button.js';

const STORAGE_KEY = 'onboarding-tour-complete';

interface TooltipStep {
  target: string;
  title: string;
  description: string;
  icon: string;
}

const STEPS: TooltipStep[] = [
  {
    target: 'create-course',
    title: 'Create a Course',
    icon: '🚀',
    description:
      'Start here! Tell the AI what you want to learn and it will generate a personalized course for you.',
  },
  {
    target: 'mindmap-nav',
    title: 'Knowledge Mindmap',
    icon: '🧠',
    description:
      'Watch your knowledge grow as you learn. Your mindmap visualizes connections between topics.',
  },
  {
    target: 'marketplace-nav',
    title: 'Course Marketplace',
    icon: '🏪',
    description:
      'Browse courses created by the community and find AI agents to enhance your learning.',
  },
];

/** Contextual onboarding tooltips shown on first Dashboard visit */
export function OnboardingTooltips() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const complete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      complete();
    }
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none" aria-label="Onboarding tour">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 pointer-events-auto" onClick={complete} />

      {/* Tooltip Card */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-elevated p-6 max-w-sm w-full space-y-4">
          {/* Progress */}
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-accent' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          <div className="text-center space-y-2">
            <span className="text-4xl">{current.icon}</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{current.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{current.description}</p>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={complete}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              <span className="text-xs text-gray-400 self-center">
                {step + 1} / {STEPS.length}
              </span>
              <Button variant="primary" size="sm" onClick={next}>
                {step < STEPS.length - 1 ? 'Next' : 'Got it'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
