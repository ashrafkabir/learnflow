import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TOPICS = [
  'AI & Machine Learning',
  'Web Development',
  'Data Science',
  'Cloud Computing',
  'Cybersecurity',
  'Mobile Development',
  'Blockchain',
  'DevOps',
];

export function OnboardingTopics() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (t: string) =>
    setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  return (
    <section aria-label="Preferred Topics" data-screen="onboarding-topics" style={{ padding: 24 }}>
      <h1 style={{ fontSize: '24px', marginBottom: 16 }}>What topics interest you?</h1>
      <div role="group" aria-label="Topics selection">
        {TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => toggle(t)}
            aria-pressed={selected.includes(t)}
            style={{
              margin: 4,
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: 8,
              background: selected.includes(t) ? '#10B981' : '#fff',
              color: selected.includes(t) ? '#fff' : '#111',
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <button onClick={() => nav('/onboarding/experience')} style={{ marginTop: 24 }}>
        Continue
      </button>
    </section>
  );
}
