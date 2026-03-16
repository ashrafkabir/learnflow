import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export function OnboardingExperience() {
  const nav = useNavigate();
  const [level, setLevel] = useState('');

  return (
    <section
      aria-label="Experience Level"
      data-screen="onboarding-experience"
      style={{ padding: 24 }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: 16 }}>What's your experience level?</h1>
      <div role="radiogroup" aria-label="Experience level">
        {LEVELS.map((l) => (
          <label key={l} style={{ display: 'block', margin: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="level"
              value={l}
              checked={level === l}
              onChange={() => setLevel(l)}
            />
            <span style={{ marginLeft: 8 }}>{l}</span>
          </label>
        ))}
      </div>
      <button
        onClick={() => nav('/onboarding/api-keys')}
        disabled={!level}
        style={{ marginTop: 24 }}
      >
        Continue
      </button>
    </section>
  );
}
