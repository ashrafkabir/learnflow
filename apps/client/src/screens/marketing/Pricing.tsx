import React from 'react';

export function PricingPage() {
  return (
    <section aria-label="Pricing" style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>Pricing</h1>
      <p style={{ fontSize: 18, marginBottom: 24 }}>
        Choose the plan that works for you. Start free, upgrade when ready.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 24,
        }}
      >
        <div style={{ padding: 24, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <h2>Free</h2>
          <p style={{ fontSize: 32, fontWeight: 700 }}>$0/mo</p>
          <ul style={{ listStyle: 'disc', paddingLeft: 20, marginTop: 16 }}>
            <li>3 courses per month</li>
            <li>Basic AI agent</li>
            <li>Bring your own API keys</li>
            <li>Community support</li>
          </ul>
        </div>
        <div
          style={{
            padding: 24,
            border: '2px solid #6366F1',
            borderRadius: 12,
            background: '#EEF2FF',
          }}
        >
          <h2>Pro</h2>
          <p style={{ fontSize: 32, fontWeight: 700 }}>$20/mo</p>
          <ul style={{ listStyle: 'disc', paddingLeft: 20, marginTop: 16 }}>
            <li>Unlimited courses</li>
            <li>All AI agents</li>
            <li>Priority support</li>
            <li>Advanced analytics</li>
            <li>Export to PDF/SCORM</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
