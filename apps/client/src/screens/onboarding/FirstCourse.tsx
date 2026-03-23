import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, apiPost } from '../../context/AppContext.js';
import { OnboardingProgress } from '../../components/OnboardingProgress.js';
import { Button } from '../../components/Button.js';
import { Confetti } from '../../components/Confetti.js';
import {
  IconBrainSpark,
  IconCheck,
  IconCelebrate,
  IconPipeline,
  IconSearch,
  IconSparkles,
} from '../../components/icons/index.js';

const STAGES = [
  { icon: <IconSearch className="w-10 h-10" />, label: 'Researching sources...', pct: 25 },
  { icon: <IconPipeline className="w-10 h-10" />, label: 'Building syllabus...', pct: 50 },
  { icon: <IconBrainSpark className="w-10 h-10" />, label: 'Creating lessons...', pct: 75 },
  { icon: <IconSparkles className="w-10 h-10" />, label: 'Polishing content...', pct: 100 },
];

/**
 * Onboarding completion screen with staged progress animation.
 * Spec §5.2.1 step 6 — progress animation (no course is auto-created during onboarding).
 */
export function FirstCourse() {
  const nav = useNavigate();
  const { dispatch } = useApp();
  const [stageIdx, setStageIdx] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    // Durable completion flag so onboarding isn't shown again on subsequent logins.
    // Best-effort: if it fails (offline), localStorage still prevents re-show in this browser.
    (async () => {
      try {
        await apiPost('/profile/onboarding/complete', {});
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // Animate through stages
  useEffect(() => {
    if (stageIdx < STAGES.length - 1) {
      const timer = setTimeout(() => setStageIdx((i) => i + 1), 1800);
      return () => clearTimeout(timer);
    } else if (!complete) {
      const timer = setTimeout(() => setComplete(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [stageIdx, complete]);

  const stage = STAGES[stageIdx];

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
          <span className="text-xs text-gray-500 dark:text-gray-300">6/6</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full text-center">
        <OnboardingProgress current="first-course" />

        {!complete ? (
          <>
            {/* Progress animation */}
            <div className="text-6xl mb-6 animate-bounce text-accent">{stage.icon}</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Setting up your experience
            </h1>
            <p className="text-gray-500 dark:text-gray-300 mb-6">{stage.label}</p>

            {/* Progress bar */}
            <div className="w-full max-w-xs h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-4">
              <div
                className="h-full bg-accent rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stage.pct}%` }}
              />
            </div>

            {/* Stage indicators */}
            <div className="flex gap-2 mt-4">
              {STAGES.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                    i === stageIdx
                      ? 'bg-accent/10 text-accent font-medium'
                      : i < stageIdx
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'text-gray-400'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {i < stageIdx ? <IconCheck className="w-3.5 h-3.5" /> : s.icon}
                    <span>{s.label.replace('...', '')}</span>
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Completion */}
            <Confetti trigger={true} />
            <div className="text-7xl mb-6 text-accent">
              <IconCelebrate className="w-16 h-16" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              You're All Set!
            </h1>
            <p className="text-gray-500 dark:text-gray-300 mb-8">
              Your preferences have been saved. Head to your dashboard to create your first course!
            </p>
            <Button
              variant="primary"
              size="large"
              onClick={() => nav('/dashboard')}
              aria-label="Go to Dashboard"
              className="pulse-cta"
            >
              Go to Dashboard →
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
