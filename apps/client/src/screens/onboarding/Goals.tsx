import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GOALS = [
  'Career Growth',
  'Academic Study',
  'Personal Interest',
  'Certification Prep',
  'Skill Building',
];

export function OnboardingGoals() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (g: string) =>
    setSelected((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));

  return (
    <section aria-label="Learning Goals" data-screen="onboarding-goals" style={{ padding: 24 }}>
      <h1 style={{ fontSize: '24px', marginBottom: 16 }}>What are your learning goals?</h1>
      <div role="group" aria-label="Goals selection">
        {GOALS.map((g) => (
          <button
            key={g}
            onClick={() => toggle(g)}
            aria-pressed={selected.includes(g)}
            style={{
              margin: 4,
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: 8,
              background: selected.includes(g) ? '#6366F1' : '#fff',
              color: selected.includes(g) ? '#fff' : '#111',
            }}
          >
            {g}
          </button>
        ))}
      </div>
      <button
        onClick={() => nav('/onboarding/topics')}
        disabled={selected.length === 0}
        style={{ marginTop: 24 }}
      >
        Continue
      </button>
    </section>
  );
}
