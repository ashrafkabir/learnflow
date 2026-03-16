import React from 'react';
import { useNavigate } from 'react-router-dom';

export function OnboardingWelcome() {
  const nav = useNavigate();
  return (
    <section aria-label="Welcome" data-screen="onboarding-welcome" style={{ padding: 24 }}>
      <h1 style={{ fontSize: '32px', marginBottom: 16 }}>Welcome to LearnFlow</h1>
      <p style={{ fontSize: '16px', marginBottom: 24 }}>
        Your AI-powered learning companion. Create personalized courses, take smart notes, and
        master any topic with the help of intelligent agents.
      </p>
      <button onClick={() => nav('/onboarding/goals')} aria-label="Get Started">
        Get Started
      </button>
    </section>
  );
}
