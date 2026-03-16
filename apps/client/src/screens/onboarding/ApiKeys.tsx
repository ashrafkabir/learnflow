import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function OnboardingApiKeys() {
  const nav = useNavigate();
  const [key, setKey] = useState('');

  return (
    <section aria-label="API Key Setup" data-screen="onboarding-apikeys" style={{ padding: 24 }}>
      <h1 style={{ fontSize: '24px', marginBottom: 16 }}>Connect Your AI Provider</h1>
      <p style={{ marginBottom: 16, fontSize: '14px' }}>
        Bring your own API key from OpenAI, Anthropic, or Google. Your key is encrypted and never
        shared.
      </p>
      <label htmlFor="api-key-input">API Key</label>
      <input
        id="api-key-input"
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="sk-..."
        style={{
          display: 'block',
          width: '100%',
          maxWidth: 400,
          padding: 8,
          marginTop: 8,
          marginBottom: 16,
        }}
      />
      <button onClick={() => nav('/onboarding/ready')} style={{ marginRight: 8 }}>
        {key ? 'Save & Continue' : 'Skip for now'}
      </button>
    </section>
  );
}
