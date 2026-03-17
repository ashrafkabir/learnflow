import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.js';

const STEPS = [
  { label: 'Analyzing your goals...', icon: '🎯' },
  { label: 'Researching sources...', icon: '🔍' },
  { label: 'Building course structure...', icon: '🏗️' },
  { label: 'Generating lessons...', icon: '📝' },
  { label: 'Finalizing your course!', icon: '✨' },
];

export function FirstCourse() {
  const nav = useNavigate();
  const { state, createCourse, dispatch } = useApp();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);

  // Auto-generate first course from onboarding topics
  useEffect(() => {
    if (generating || done) return;
    const topic = state.onboarding.topics[0] || 'Agentic AI';
    setGenerating(true);

    // Animate steps
    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1200);

    createCourse(topic)
      .then((course) => {
        setCourseId(course.id);
        setDone(true);
        clearInterval(interval);
        setStep(STEPS.length - 1);
        dispatch({ type: 'COMPLETE_ONBOARDING' });
      })
      .catch(() => {
        setDone(true);
        clearInterval(interval);
        dispatch({ type: 'COMPLETE_ONBOARDING' });
      });

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      aria-label="First Course Generation"
      data-screen="onboarding-ready"
      className="min-h-screen bg-gradient-to-br from-accent/10 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col"
    >
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full w-full bg-accent rounded-full transition-all" />
          </div>
          <span className="text-xs text-gray-400">6/6</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full text-center">
        {!done ? (
          <>
            <div className="text-6xl mb-6 animate-bounce">{STEPS[step].icon}</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Creating Your First Course
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{STEPS[step].label}</p>

            {/* Progress steps */}
            <div className="w-full space-y-3">
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    i <= step ? 'bg-white/80 dark:bg-gray-800/80' : 'opacity-40'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      i < step
                        ? 'bg-success text-white'
                        : i === step
                          ? 'bg-accent text-white animate-pulse'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {i < step ? '✓' : s.icon}
                  </span>
                  <span
                    className={`text-sm ${i <= step ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'}`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="text-7xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              You're All Set!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Your first course is ready. Let's start learning!
            </p>
            <button
              onClick={() => (courseId ? nav(`/courses/${courseId}`) : nav('/dashboard'))}
              aria-label="Go to Dashboard"
              className="px-8 py-4 bg-accent text-white font-semibold text-lg rounded-xl hover:bg-accent-dark transition-colors shadow-lg"
            >
              {courseId ? 'Start Learning →' : 'Go to Dashboard'}
            </button>
            <button
              onClick={() => nav('/dashboard')}
              className="mt-3 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Go to Dashboard instead
            </button>
          </>
        )}
      </div>
    </section>
  );
}
