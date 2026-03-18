import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, apiBase } from '../../context/AppContext.js';
import { OnboardingProgress } from '../../components/OnboardingProgress.js';
import { Button } from '../../components/Button.js';

const TOPICS = [
  { id: 'ai', icon: '🤖', label: 'Artificial Intelligence' },
  { id: 'web', icon: '🌐', label: 'Web Development' },
  { id: 'data', icon: '📊', label: 'Data Science' },
  { id: 'rust', icon: '⚙️', label: 'Rust / Systems' },
  { id: 'quantum', icon: '⚛️', label: 'Quantum Computing' },
  { id: 'security', icon: '🔒', label: 'Cybersecurity' },
  { id: 'cloud', icon: '☁️', label: 'Cloud & DevOps' },
  { id: 'blockchain', icon: '🔗', label: 'Blockchain' },
  { id: 'design', icon: '🎨', label: 'UI/UX Design' },
  { id: 'climate', icon: '🌱', label: 'Climate Tech' },
  { id: 'bio', icon: '🧬', label: 'Biotech & Genomics' },
  { id: 'finance', icon: '💰', label: 'FinTech' },
];

/** Adjacent topic suggestions — spec §5.2.1 step 3 */
const ADJACENT_MAP: Record<string, string[]> = {
  ai: ['data', 'rust', 'quantum'],
  web: ['design', 'cloud', 'ai'],
  data: ['ai', 'finance', 'bio'],
  rust: ['cloud', 'security', 'quantum'],
  quantum: ['ai', 'rust', 'data'],
  security: ['cloud', 'blockchain', 'rust'],
  cloud: ['security', 'web', 'rust'],
  blockchain: ['finance', 'security', 'cloud'],
  design: ['web', 'ai', 'climate'],
  climate: ['bio', 'data', 'design'],
  bio: ['data', 'ai', 'climate'],
  finance: ['blockchain', 'data', 'ai'],
};

export function OnboardingTopics() {
  const nav = useNavigate();
  const { dispatch } = useApp();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  // Compute adjacent suggestions based on current selections
  const suggestions = useMemo(() => {
    const sugg = new Set<string>();
    for (const sel of selected) {
      const adj = ADJACENT_MAP[sel];
      if (adj) adj.forEach((a) => sugg.add(a));
    }
    // Remove already-selected topics
    selected.forEach((s) => sugg.delete(s));
    return TOPICS.filter((t) => sugg.has(t.id));
  }, [selected]);

  const next = async () => {
    dispatch({ type: 'SET_ONBOARDING_TOPICS', topics: selected });
    dispatch({ type: 'SET_ONBOARDING_STEP', step: 2 });
    try {
      const token = localStorage.getItem('learnflow-token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${apiBase()}/api/v1/profile/goals`, { method: 'POST', headers, body: JSON.stringify({ topics: selected }) });
    } catch { /* best effort */ }
    nav('/onboarding/api-keys');
  };

  return (
    <div
      data-screen="onboarding-topics"
      className="slide-in-right min-h-screen bg-gray-50 dark:bg-bg-dark flex flex-col"
    >
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full w-2/5 bg-accent rounded-full transition-all" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">2/6</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6 max-w-lg mx-auto w-full">
        <OnboardingProgress current="topics" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          What interests you?
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Pick topics you want to explore. You can always change these later.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {TOPICS.map((t) => (
            <Button
              key={t.id}
              variant="ghost"
              onClick={() => toggle(t.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left h-auto justify-start ${
                selected.includes(t.id)
                  ? 'border-accent bg-accent/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{t.label}</span>
            </Button>
          ))}
        </div>

        {/* Adjacent topic suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-6 animate-fade-in">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">💡 Suggested for you:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((t) => (
                <Button
                  key={t.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => toggle(t.id)}
                  className="border border-dashed border-accent/40 text-accent hover:bg-accent/5 rounded-full"
                >
                  {t.icon} {t.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {selected.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select at least one topic to continue, or skip this step.</p>
        )}
        <div className="flex gap-3 items-center">
          <Button variant="secondary" onClick={() => nav('/onboarding/goals')} className="px-6 py-4">
            Back
          </Button>
          <Button variant="primary" fullWidth onClick={next} disabled={selected.length === 0} className="py-4">
            Continue
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { dispatch({ type: 'SET_ONBOARDING_STEP', step: 2 }); nav('/onboarding/api-keys'); }}
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
