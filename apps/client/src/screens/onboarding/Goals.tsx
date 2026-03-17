import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.js';

const GOALS = [
  {
    id: 'career',
    icon: '💼',
    label: 'Career advancement',
    desc: 'Learn skills for your next role',
  },
  {
    id: 'curiosity',
    icon: '🔍',
    label: 'Intellectual curiosity',
    desc: 'Explore topics that fascinate you',
  },
  { id: 'academic', icon: '🎓', label: 'Academic study', desc: 'Supplement your coursework' },
  { id: 'project', icon: '🛠️', label: 'Build a project', desc: 'Learn by building something real' },
  {
    id: 'certification',
    icon: '📜',
    label: 'Get certified',
    desc: 'Prepare for professional certifications',
  },
  { id: 'teaching', icon: '👩‍🏫', label: 'Teach others', desc: 'Deepen knowledge to share it' },
];

export function OnboardingGoals() {
  const nav = useNavigate();
  const { dispatch } = useApp();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const next = () => {
    dispatch({ type: 'SET_ONBOARDING_GOALS', goals: selected });
    dispatch({ type: 'SET_ONBOARDING_STEP', step: 1 });
    nav('/onboarding/topics');
  };

  return (
    <div
      data-screen="onboarding-goals"
      className="min-h-screen bg-gray-50 dark:bg-bg-dark flex flex-col"
    >
      {/* Progress */}
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full w-1/5 bg-accent rounded-full transition-all" />
          </div>
          <span className="text-xs text-gray-400">1/5</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6 max-w-lg mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          What are your learning goals?
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Select all that apply. This helps us personalize your experience.
        </p>

        <div className="grid grid-cols-1 gap-3 mb-8">
          {GOALS.map((g) => (
            <button
              key={g.id}
              onClick={() => toggle(g.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                selected.includes(g.id)
                  ? 'border-accent bg-accent/5 dark:bg-accent/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{g.icon}</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{g.label}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{g.desc}</div>
              </div>
              {selected.includes(g.id) && <span className="ml-auto text-accent">✓</span>}
            </button>
          ))}
        </div>

        <button
          onClick={next}
          disabled={selected.length === 0}
          className="w-full py-4 bg-accent text-white font-semibold rounded-xl hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
