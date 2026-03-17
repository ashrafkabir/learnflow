import React from 'react';
import { useNavigate } from 'react-router-dom';

export function OnboardingWelcome() {
  const nav = useNavigate();

  return (
    <div
      data-screen="onboarding-welcome"
      className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-6"
    >
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <span className="text-4xl">🧠</span>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white tracking-tight">Welcome to LearnFlow</h1>
          <p className="text-lg text-primary-200 leading-relaxed">
            AI-powered learning that adapts to you. Build courses from real sources, take smart
            notes, and master any topic.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-3 text-left">
          {[
            { icon: '📚', text: 'AI-generated courses from real web sources' },
            { icon: '🎯', text: 'Personalized learning paths & adaptive quizzes' },
            { icon: '📝', text: 'Cornell notes, flashcards & mind maps' },
          ].map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4"
            >
              <span className="text-2xl">{f.icon}</span>
              <span className="text-sm text-primary-100">{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => nav('/onboarding/goals')}
          className="w-full py-4 bg-accent text-white font-semibold rounded-xl hover:bg-accent-dark transition-colors text-lg shadow-lg shadow-accent/25"
        >
          Get Started
        </button>

        <p className="text-xs text-primary-300">Takes about 2 minutes to set up</p>
      </div>
    </div>
  );
}
