import React from 'react';

const STEPS = [
  { path: 'welcome', label: 'Welcome' },
  { path: 'goals', label: 'Goals' },
  { path: 'topics', label: 'Topics' },
  { path: 'api-keys', label: 'API Keys' },
  { path: 'subscription', label: 'Plan' },
  { path: 'first-course', label: 'Start' },
];

export function OnboardingProgress({ current }: { current: string }) {
  const currentIdx = STEPS.findIndex((s) => s.path === current);

  return (
    <nav aria-label="Onboarding progress" className="flex items-center justify-center gap-1 py-4 mb-4">
      {STEPS.map((step, i) => (
        <div key={step.path} className="flex items-center gap-1">
          <div className="flex flex-col items-center">
            <div
              className={`flex items-center justify-center rounded-full transition-all font-semibold text-xs ${
                i < currentIdx
                  ? 'w-8 h-8 bg-green-500 text-white'
                  : i === currentIdx
                    ? 'w-9 h-9 bg-accent text-white ring-2 ring-accent/30 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-950'
                    : 'w-8 h-8 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
              }`}
            >
              {i < currentIdx ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${
              i === currentIdx ? 'text-accent' : i < currentIdx ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-4 sm:w-8 h-0.5 mb-4 ${i < currentIdx ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </div>
      ))}
    </nav>
  );
}
