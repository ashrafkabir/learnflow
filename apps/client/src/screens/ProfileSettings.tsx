import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../design-system/ThemeProvider.js';

/** S08-A10: Profile & settings with goals, API keys, subscription, export, privacy */
export function ProfileSettings() {
  const nav = useNavigate();
  const { mode, toggle } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'keys' | 'subscription' | 'privacy'>(
    'profile',
  );

  const tabs = [
    { id: 'profile' as const, label: 'Profile & Goals' },
    { id: 'keys' as const, label: 'API Keys' },
    { id: 'subscription' as const, label: 'Subscription' },
    { id: 'privacy' as const, label: 'Privacy & Export' },
  ];

  return (
    <section
      aria-label="Profile Settings"
      data-screen="profile-settings"
      style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}
    >
      <button onClick={() => nav('/dashboard')} style={{ marginBottom: 16 }}>
        ← Back
      </button>
      <h1 style={{ fontSize: '24px', marginBottom: 16 }}>Settings</h1>

      <nav
        aria-label="Settings tabs"
        style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            role="tab"
            aria-selected={activeTab === t.id}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === t.id ? '2px solid #6366F1' : '2px solid transparent',
              color: activeTab === t.id ? '#6366F1' : '#6b7280',
              fontWeight: activeTab === t.id ? 600 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {activeTab === 'profile' && (
        <div data-section="profile-goals" aria-label="Profile and goals">
          <h2 style={{ fontSize: '20px', marginBottom: 12 }}>Learning Goals</h2>
          <div style={{ marginBottom: 16 }}>
            {['Career Growth', 'Certification Prep'].map((g) => (
              <span
                key={g}
                style={{
                  display: 'inline-block',
                  margin: 4,
                  padding: '4px 12px',
                  background: '#EEF2FF',
                  borderRadius: 16,
                  fontSize: 14,
                }}
              >
                {g}
              </span>
            ))}
          </div>
          <h2 style={{ fontSize: '20px', marginBottom: 12 }}>Appearance</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Dark Mode</span>
            <button
              onClick={toggle}
              aria-label={`Toggle dark mode (currently ${mode})`}
              style={{ padding: '4px 12px', borderRadius: 16, border: '1px solid #d1d5db' }}
            >
              {mode === 'dark' ? '🌙 On' : '☀️ Off'}
            </button>
          </label>
        </div>
      )}

      {activeTab === 'keys' && (
        <div data-section="api-keys" aria-label="API key management">
          <h2 style={{ fontSize: '20px', marginBottom: 12 }}>API Keys</h2>
          <div
            style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>OpenAI</span>
              <span style={{ fontFamily: 'monospace', color: '#6b7280' }}>sk-...Xf4m</span>
            </div>
          </div>
          <button style={{ padding: '8px 16px' }}>+ Add Key</button>
        </div>
      )}

      {activeTab === 'subscription' && (
        <div data-section="subscription" aria-label="Subscription management">
          <h2 style={{ fontSize: '20px', marginBottom: 12 }}>Subscription</h2>
          <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
            <p style={{ fontSize: '16px', fontWeight: 600 }}>Free Plan</p>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: 4 }}>
              Basic access with your own API keys
            </p>
            <button
              style={{
                marginTop: 12,
                padding: '8px 24px',
                background: '#6366F1',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Upgrade to Pro — $20/mo
            </button>
          </div>
        </div>
      )}

      {activeTab === 'privacy' && (
        <div data-section="privacy-export" aria-label="Privacy and data export">
          <h2 style={{ fontSize: '20px', marginBottom: 12 }}>Privacy & Data</h2>
          <button style={{ padding: '8px 16px', marginRight: 8 }}>📥 Export My Data</button>
          <button style={{ padding: '8px 16px', color: '#EF4444' }}>🗑️ Delete Account</button>
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: '16px', marginBottom: 8 }}>Data Handling</h3>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Your API keys are encrypted with AES-256. Learning data is stored locally and synced
              securely. You can export or delete all data at any time.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
