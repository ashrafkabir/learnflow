import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.js';
import { OnboardingProgress } from '../../components/OnboardingProgress.js';

/**
 * Onboarding completion screen.
 * Does NOT create a course — just saves preferences and redirects to dashboard.
 */
export function FirstCourse() {
  const nav = useNavigate();
  const { dispatch } = useApp();

  useEffect(() => {
    // Mark onboarding as complete (preferences already saved in prior steps)
    dispatch({ type: 'COMPLETE_ONBOARDING' });
  }, []);

  return (
    <section
      aria-label="Onboarding Complete"
      data-screen="onboarding-ready"
      className="slide-in-right min-h-screen bg-gradient-to-br from-accent/10 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col"
    >
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full w-full bg-accent rounded-full transition-all" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">6/6</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full text-center">
        <OnboardingProgress current="first-course" />
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          You're All Set!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Your preferences have been saved. Head to your dashboard to create your first course!
        </p>
        <button
          onClick={() => nav('/dashboard')}
          aria-label="Go to Dashboard"
          className="px-8 py-4 bg-accent text-white font-semibold text-lg rounded-xl hover:bg-accent-dark transition-colors shadow-lg pulse-cta"
        >
          Go to Dashboard →
        </button>
      </div>
    </section>
  );
}
