import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, apiBase } from '../../context/AppContext.js';
import { OnboardingProgress } from '../../components/OnboardingProgress.js';
import { Button } from '../../components/Button.js';
import { IconX } from '../../components/icons/index.js';

const GOAL_SUGGESTIONS = [
  'Career advancement',
  'Intellectual curiosity',
  'Academic study',
  'Build a project',
  'Get certified',
  'Teach others',
];

/** Spec §5.2.1 — Step 2: Goal Setting */
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
    try {
      const token = localStorage.getItem('learnflow-token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${apiBase()}/api/v1/profile/goals`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ goals }),
      });
    } catch {
      /* best effort */
    }
    nav('/onboarding/topics');
  };

  return (
    <div
      data-screen="onboarding-goals"
      className="slide-in-right min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col"
    >
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full w-1/6 bg-accent rounded-full transition-all" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-300">1/6</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6 max-w-lg mx-auto w-full">
        <OnboardingProgress current="goals" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          What do you want to learn?
        </h1>
        <p className="text-gray-500 dark:text-gray-300 mb-6">
          Tell us about your learning goals in your own words, or pick from suggestions below.
        </p>

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
            <Button variant="primary" onClick={() => addGoal(goalText)} disabled={!goalText.trim()}>
              Add
            </Button>
          </div>
        </div>

        {goals.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {goals.map((g) => (
              <span
                key={g}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm"
              >
                {g}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeGoal(g)}
                  className="ml-1 text-accent/50 hover:text-accent p-0 h-auto"
                >
                  <IconX className="w-4 h-4" />
                </Button>
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-300 mb-2">Or pick from common goals:</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {GOAL_SUGGESTIONS.filter((s) => !goals.includes(s)).map((s) => (
            <Button
              key={s}
              variant="ghost"
              size="sm"
              onClick={() => addGoal(s)}
              className="text-xs border border-gray-200 dark:border-gray-700 hover:border-accent hover:text-accent"
            >
              + {s}
            </Button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => nav('/onboarding/welcome')}
            className="px-6 py-4"
          >
            Back
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={next}
            disabled={goals.length === 0}
            className="py-4"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
