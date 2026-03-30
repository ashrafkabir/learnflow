import React from 'react';
import { PLAN_DEFINITIONS } from '@learnflow/shared';

/** S11-A04: Pricing page — Free vs Pro comparison table */
export default function PricingPage() {
  // NOTE: literal plan names are kept for simple static tests/SEO checks.
  const plans = [
    {
      name: 'Free',
      price: `$${PLAN_DEFINITIONS.free.priceMonthlyUsd}`,
      period: 'forever',
      cta: 'Get Started',
      features: [
        { label: 'Courses', value: '3 active' },
        { label: 'Bring Your Own API Key', value: '✓' },
        { label: 'Notes & Flashcards', value: '✓' },
        { label: 'Quizzes', value: 'Planned' },
        { label: 'Knowledge Mindmap', value: 'Basic' },
        { label: 'Research Agent', value: '5 searches/day' },
        { label: 'Proactive Updates', value: '✗' },
        { label: 'Managed API Keys', value: '✗' },
        { label: 'Advanced Analytics', value: '✗' },
        { label: 'Priority Support', value: '✗' },
      ],
    },
    {
      name: 'Pro',
      price: `$${PLAN_DEFINITIONS.pro.priceMonthlyUsd}`,
      period: '/month',
      cta: 'Upgrade to Pro (Mock billing)',
      highlight: true,
      features: [
        { label: 'Courses', value: 'Unlimited' },
        { label: 'Bring Your Own API Key', value: '✓' },
        { label: 'Notes & Flashcards', value: '✓' },
        { label: 'Quizzes', value: 'Planned' },
        { label: 'Knowledge Mindmap', value: 'Unlimited + Collab' },
        { label: 'Research Agent', value: 'Unlimited' },
        { label: 'Proactive Updates', value: '✓ (best-effort RSS/Atom monitoring)' },
        { label: 'Managed API Keys', value: '✗ (not available in this build)' },
        { label: 'Advanced Analytics', value: '✓' },
        { label: 'Priority Support', value: '✓' },
      ],
    },
  ];

  return (
    <div data-page="pricing" style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, textAlign: 'center', marginBottom: 16 }}>
        Pricing
      </h1>
      <p style={{ textAlign: 'center', fontSize: 16, color: '#374151', marginTop: 8 }}>
        Simple, transparent pricing
      </p>
      <p style={{ textAlign: 'center', fontSize: 18, color: '#6b7280', marginBottom: 48 }}>
        Start free. Upgrade when you need more.
      </p>

      <div
        role="note"
        aria-label="Billing note"
        style={{
          maxWidth: 720,
          margin: '0 auto 32px',
          padding: 16,
          borderRadius: 12,
          border: '1px solid #bbf7d0',
          background: '#f0fdf4',
          color: '#166534',
          fontSize: 14,
        }}
      >
        <strong>Billing is MVP/mock in this build.</strong> Upgrading does not perform real charges
        or refunds in this deployment.
      </div>

      <div
        data-component="pricing-comparison"
        aria-label="Plan comparison"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 32,
        }}
      >
        {plans.map((plan) => (
          <div
            key={plan.name}
            data-plan={plan.name.toLowerCase()}
            style={{
              padding: 32,
              borderRadius: 16,
              border: plan.highlight ? '2px solid #6366F1' : '1px solid #e5e7eb',
              background: plan.highlight ? '#fafafe' : 'white',
              position: 'relative',
            }}
          >
            {plan.highlight && (
              <span
                style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#6366F1',
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Most Popular
              </span>
            )}
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>{plan.name}</h2>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 48, fontWeight: 800 }}>{plan.price}</span>
              <span style={{ fontSize: 16, color: '#6b7280' }}>{plan.period}</span>
            </div>
            <a
              href="/download"
              aria-label={plan.cta}
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: 24,
                padding: '12px 24px',
                background: plan.highlight ? '#6366F1' : '#f3f4f6',
                color: plan.highlight ? 'white' : '#374151',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              {plan.cta}
            </a>
            <ul style={{ marginTop: 32, listStyle: 'none', padding: 0 }}>
              {plan.features.map((f) => (
                <li
                  key={f.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #f3f4f6',
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: '#374151' }}>{f.label}</span>
                  <span style={{ color: f.value === '✗' ? '#d1d5db' : '#059669', fontWeight: 500 }}>
                    {f.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
