import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  tier: string;
  rating: number;
  usageCount: number;
  requiredProvider: string;
}

const AGENTS: Agent[] = [
  { id: 'a1', name: 'Code Tutor', description: 'Reviews and explains code with detailed feedback', capabilities: ['code_review', 'explain_code'], tier: 'free', rating: 4.7, usageCount: 3200, requiredProvider: 'openai' },
  { id: 'a2', name: 'Research Pro', description: 'Deep research with academic paper access', capabilities: ['deep_research', 'paper_analysis'], tier: 'pro', rating: 4.9, usageCount: 1800, requiredProvider: 'openai' },
  { id: 'a3', name: 'Math Solver', description: 'Step-by-step math problem solving', capabilities: ['math_solve', 'proof_check'], tier: 'free', rating: 4.5, usageCount: 2500, requiredProvider: 'openai' },
  { id: 'a4', name: 'Language Coach', description: 'Personalized language learning assistant', capabilities: ['translation', 'grammar_check', 'conversation'], tier: 'pro', rating: 4.6, usageCount: 1200, requiredProvider: 'anthropic' },
];

/** Spec §5.2.6, §7.2 — Agent Marketplace with activation flow */
export function AgentMarketplace() {
  const nav = useNavigate();
  const [activatedIds, setActivatedIds] = useState<Set<string>>(new Set());
  const [activating, setActivating] = useState<string | null>(null);

  const handleActivate = async (agent: Agent) => {
    setActivating(agent.id);
    try {
      const token = localStorage.getItem('learnflow-token');
      if (token) {
        await fetch(`/api/v1/marketplace/agents/${agent.id}/activate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
      }
      setActivatedIds((prev) => new Set([...prev, agent.id]));
    } catch {
      // silent fail
    } finally {
      setActivating(null);
    }
  };

  return (
    <section
      aria-label="Agent Marketplace"
      data-screen="agent-marketplace"
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button onClick={() => nav('/dashboard')} className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">←</button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">🤖 Agent Marketplace</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* My Agents section */}
        {activatedIds.size > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">✅ My Agents</h2>
            <div className="flex flex-wrap gap-2">
              {AGENTS.filter((a) => activatedIds.has(a.id)).map((a) => (
                <span key={a.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm">
                  🤖 {a.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div
          data-component="agent-catalog"
          aria-label="Agent catalog"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {AGENTS.map((a) => {
            const isActivated = activatedIds.has(a.id);
            return (
              <div
                key={a.id}
                role="article"
                aria-label={a.name}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:border-accent hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{a.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.tier === 'free' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                    {a.tier}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{a.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span>⭐ {a.rating}</span>
                  <span>·</span>
                  <span>{a.usageCount.toLocaleString()} uses</span>
                  <span>·</span>
                  <span className="capitalize">Requires {a.requiredProvider}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {a.capabilities.map((c) => (
                    <span key={c} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                      {c}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => !isActivated && handleActivate(a)}
                  disabled={isActivated || activating === a.id}
                  aria-label={`Activate ${a.name}`}
                  className={`w-full py-2.5 font-medium rounded-xl text-sm transition-colors ${
                    isActivated
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 cursor-default'
                      : 'bg-accent text-white hover:bg-accent-dark disabled:opacity-50'
                  }`}
                >
                  {isActivated ? '✅ Activated' : activating === a.id ? 'Activating...' : 'Activate'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
