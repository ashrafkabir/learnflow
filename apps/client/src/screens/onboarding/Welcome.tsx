import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingProgress } from '../../components/OnboardingProgress.js';
import { Button } from '../../components/Button.js';
import { useSwipe } from '../../hooks/useSwipe.js';
import {
  IconBrainSpark,
  IconCourse,
  IconLesson,
  IconProgressRing,
} from '../../components/icons/index.js';

export function OnboardingWelcome() {
  const nav = useNavigate();
  const swipeProps = useSwipe({ onSwipeLeft: () => nav('/onboarding/goals') });

  return (
    <div
      data-screen="onboarding-welcome"
      className="slide-in-right min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-6"
      {...swipeProps}
    >
      <div className="max-w-lg w-full text-center space-y-8">
        <OnboardingProgress current="welcome" />
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <IconBrainSpark className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white tracking-tight">Welcome to LearnFlow</h1>
          <p className="text-lg text-primary-200 leading-relaxed">
            AI-powered learning that adapts to you. Build courses from real sources, take smart
            notes, and master any topic.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 text-left">
          {[
            {
              icon: <IconCourse className="w-5 h-5" />,
              text: 'AI-generated courses from real web sources',
            },
            {
              icon: <IconProgressRing className="w-5 h-5" />,
              text: 'Personalized learning paths & adaptive quizzes',
            },
            {
              icon: <IconLesson className="w-5 h-5" />,
              text: 'Cornell notes, flashcards & mind maps',
            },
          ].map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4"
            >
              <span className="text-primary-100">{f.icon}</span>
              <span className="text-sm text-primary-100">{f.text}</span>
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          fullWidth
          size="large"
          onClick={() => nav('/onboarding/goals')}
          className="shadow-accent/25"
        >
          Get Started
        </Button>

        <p className="text-xs text-primary-300">Takes about 2 minutes to set up</p>
      </div>
    </div>
  );
}
