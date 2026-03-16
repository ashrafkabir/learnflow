import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  tier: string;
}

const AGENTS: Agent[] = [
  {
    id: 'a1',
    name: 'Code Tutor',
    description: 'Reviews and explains code with detailed feedback',
    capabilities: ['code_review', 'explain_code'],
    tier: 'free',
  },
  {
    id: 'a2',
    name: 'Research Pro',
    description: 'Deep research with academic paper access',
    capabilities: ['deep_research', 'paper_analysis'],
    tier: 'pro',
  },
  {
    id: 'a3',
    name: 'Math Solver',
    description: 'Step-by-step math problem solving',
    capabilities: ['math_solve', 'proof_check'],
    tier: 'free',
  },
  {
    id: 'a4',
    name: 'Language Coach',
    description: 'Personalized language learning assistant',
    capabilities: ['translation', 'grammar_check', 'conversation'],
    tier: 'pro',
  },
];

/** S08-A08: Agent marketplace with browsable catalog and activation */
export function AgentMarketplace() {
  const nav = useNavigate();

  return (
    <section aria-label="Agent Marketplace" data-screen="agent-marketplace" style={{ padding: 24 }}>
      <button onClick={() => nav('/dashboard')} style={{ marginBottom: 16 }}>
        ← Back
      </button>
      <h1 style={{ fontSize: '24px', marginBottom: 16 }}>Agent Marketplace</h1>
      <div
        data-component="agent-catalog"
        aria-label="Agent catalog"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {AGENTS.map((a) => (
          <div
            key={a.id}
            role="article"
            aria-label={a.name}
            style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px' }}>{a.name}</h3>
              <span
                style={{
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: a.tier === 'free' ? '#D1FAE5' : '#EEF2FF',
                  color: a.tier === 'free' ? '#059669' : '#4F46E5',
                }}
              >
                {a.tier}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: 8 }}>{a.description}</p>
            <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {a.capabilities.map((c) => (
                <span
                  key={c}
                  style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    background: '#f3f4f6',
                    borderRadius: 4,
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
            <button
              aria-label={`Activate ${a.name}`}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '8px',
                borderRadius: 8,
                background: '#10B981',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Activate
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
