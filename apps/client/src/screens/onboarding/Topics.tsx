import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.js';

const TOPICS = [
  { id: 'ai', icon: '🤖', label: 'Artificial Intelligence' },
  { id: 'web', icon: '🌐', label: 'Web Development' },
  { id: 'data', icon: '📊', label: 'Data Science' },
  { id: 'rust', icon: '⚙️', label: 'Rust / Systems' },
  { id: 'quantum', icon: '⚛️', label: 'Quantum Computing' },
  { id: 'security', icon: '🔒', label: 'Cybersecurity' },
  { id: 'cloud', icon: '☁️', label: 'Cloud & DevOps' },
  { id: 'blockchain', icon: '🔗', label: 'Blockchain' },
  { id: 'design', icon: '🎨', label: 'UI/UX Design' },
  { id: 'climate', icon: '🌱', label: 'Climate Tech' },
  { id: 'bio', icon: '🧬', label: 'Biotech & Genomics' },
  { id: 'finance', icon: '💰', label: 'FinTech' },
];

export function OnboardingTopics() {
  const nav = useNavigate();
  const { dispatch } = useApp();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const next = () => {
    dispatch({ type: 'SET_ONBOARDING_TOPICS', topics: selected });
    dispatch({ type: 'SET_ONBOARDING_STEP', step: 2 });
    nav('/onboarding/experience');
  };

  return (
    <div
      data-screen="onboarding-topics"
      className="min-h-screen bg-gray-50 dark:bg-bg-dark flex flex-col"
    >
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full w-2/5 bg-accent rounded-full transition-all" />
          </div>
          <span className="text-xs text-gray-400">2/5</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6 max-w-lg mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          What interests you?
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Pick topics you want to explore. You can always change these later.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                selected.includes(t.id)
                  ? 'border-accent bg-accent/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{t.label}</span>
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
