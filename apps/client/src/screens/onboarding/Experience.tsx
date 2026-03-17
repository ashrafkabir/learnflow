import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.js';

const LEVELS = [
  { id: 'beginner', icon: '🌱', label: 'Beginner', desc: 'Just starting out, teach me the basics' },
  {
    id: 'intermediate',
    icon: '🌿',
    label: 'Intermediate',
    desc: 'I know fundamentals, ready to go deeper',
  },
  {
    id: 'advanced',
    icon: '🌳',
    label: 'Advanced',
    desc: 'Experienced, looking for expert-level content',
  },
];

export function OnboardingExperience() {
  const nav = useNavigate();
  const { dispatch } = useApp();
  const [selected, setSelected] = useState('');

  const next = () => {
    dispatch({ type: 'SET_ONBOARDING_EXPERIENCE', experience: selected });
    dispatch({ type: 'SET_ONBOARDING_STEP', step: 3 });
    nav('/onboarding/api-keys');
  };

  return (
    <div
      data-screen="onboarding-experience"
      className="min-h-screen bg-gray-50 dark:bg-bg-dark flex flex-col"
    >
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full w-3/5 bg-accent rounded-full transition-all" />
          </div>
          <span className="text-xs text-gray-400">3/5</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6 max-w-lg mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          What's your experience level?
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          We'll adjust content complexity to match your level.
        </p>

        <div className="space-y-3 mb-8">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelected(l.id)}
              className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${
                selected === l.id
                  ? 'border-accent bg-accent/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-3xl">{l.icon}</span>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{l.label}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{l.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={next}
          disabled={!selected}
          className="w-full py-4 bg-accent text-white font-semibold rounded-xl hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
