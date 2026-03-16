import React from 'react';
import { useNavigate } from 'react-router-dom';

export function OnboardingReady() {
  const nav = useNavigate();
  return (
    <section
      aria-label="Ready"
      data-screen="onboarding-ready"
      style={{ padding: 24, textAlign: 'center' }}
    >
      <h1 style={{ fontSize: '32px', marginBottom: 16 }}>You're All Set! 🎉</h1>
      <p style={{ fontSize: '16px', marginBottom: 24 }}>
        LearnFlow is ready to help you learn. Start by creating your first course or exploring the
        marketplace.
      </p>
      <button
        onClick={() => nav('/dashboard')}
        aria-label="Go to Dashboard"
        style={{
          padding: '12px 32px',
          fontSize: 16,
          background: '#6366F1',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        Go to Dashboard
      </button>
    </section>
  );
}
