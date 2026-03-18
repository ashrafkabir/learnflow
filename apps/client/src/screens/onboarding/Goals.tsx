import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, apiBase } from '../../context/AppContext.js';
import { OnboardingProgress } from '../../components/OnboardingProgress.js';

const GOAL_SUGGESTIONS = [
  'Career advancement',
  'Intellectual curiosity',
  'Academic study',
  'Build a project',
  'Get certified',
  'Teach others',
];

/**
 * Spec §5.2.1 — Step 2: Goal Setting
 * "Conversational interface where user describes what they want to learn"
 */
export function OnboardingGoals() {
  const nav = useNavigate();
  const { dispatch } = useApp();
  const [goalText, setGoalText] = useState('');
  const [goals, setGoals] = useState<string[]>([]);

  const addGoal = (text: string) => {
    const trimmed = text.trim();
    if (trimmed && !goals.includes(trimmed)) {
      setGoals([...goals, trimmed]);
      setGoalText('');
    }
  };

  const removeGoal = (goal: string) => {
    setGoals(goals.filter((g) => g !== goal));
  };

  const next = async () => {
    dispatch({ type: 'SET_ONBOARDING_GOALS', goals });
    dispatch({ type: 'SET_ONBOARDING_STEP', step: 1 });
    // Save goals to API
    try {
      const token = localStorage.getItem('learnflow-token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${apiBase()}/api/v1/profile/goals`, { method: 'POST', headers, body: JSON.stringify({ goals }) });
    } catch { /* best effort */ }
    nav('/onboarding/topics');
  };

  return (
    <div
      data-screen="onboarding-goals"
      className="slide-in-right min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col"
    >
      {/* Progress */}
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full w-1/6 bg-accent rounded-full transition-all" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">1/6</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6 max-w-lg mx-auto w-full">
        <OnboardingProgress current="goals" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          What do you want to learn?
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Tell us about your learning goals in your own words, or pick from suggestions below.
        </p>

        {/* Conversational input */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGoal(goalText)}
              placeholder="e.g., I want to learn machine learning for my career..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
            <button
              onClick={() => addGoal(goalText)}
              disabled={!goalText.trim()}
              className="px-4 py-3 bg-accent text-white font-medium rounded-xl hover:bg-accent-dark disabled:opacity-40 transition-colors text-sm"
            >
              Add
            </button>
          </div>
        </div>

        {/* Added goals */}
        {goals.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {goals.map((g) => (
              <span
                key={g}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm"
              >
                {g}
                <button
                  onClick={() => removeGoal(g)}
                  className="ml-1 text-accent/50 hover:text-accent"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Suggestions */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Or pick from common goals:</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {GOAL_SUGGESTIONS.filter((s) => !goals.includes(s)).map((s) => (
            <button
              key={s}
              onClick={() => addGoal(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-all"
            >
              + {s}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => nav('/onboarding/welcome')}
            className="px-6 py-4 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Back
          </button>
          <button
            onClick={next}
            disabled={goals.length === 0}
            className="flex-1 py-4 bg-accent text-white font-semibold rounded-xl hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
