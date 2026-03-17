import React from 'react';

export function HomePage() {
  return (
    <section aria-label="Homepage" style={{ padding: 24 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center', paddingTop: 48 }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16 }}>
          Learn anything. Master everything. Powered by AI agents.
        </h1>
        <p style={{ fontSize: 20, color: '#6b7280', marginBottom: 32 }}>
          Personalized AI-powered courses generated just for you. Free to start.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <a
            href="/download"
            style={{
              padding: '12px 32px',
              background: '#6366F1',
              color: '#fff',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Download Now
          </a>
          <a
            href="/dashboard"
            style={{
              padding: '12px 32px',
              border: '1px solid #6366F1',
              color: '#6366F1',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Get Started Free
          </a>
        </div>
      </div>
    </section>
  );
}
