import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.js';
import { OnboardingProgress } from '../../components/OnboardingProgress.js';
import { Button } from '../../components/Button.js';

export function OnboardingApiKeys() {
  const nav = useNavigate();
  const { dispatch } = useApp();
  const [key, setKey] = useState('');

  const next = () => {
    dispatch({ type: 'SET_ONBOARDING_STEP', step: 4 });
    nav('/onboarding/subscription');
  };

  return (
    <div
      data-screen="onboarding-apikeys"
      aria-label="API Key Setup"
      className="slide-in-right min-h-screen bg-gray-50 dark:bg-bg-dark flex flex-col"
    >
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full w-2/3 bg-accent rounded-full transition-all" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-300">4/6</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6 max-w-lg mx-auto w-full">
        <OnboardingProgress current="api-keys" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Connect Your AI Provider
        </h1>
        <p className="text-gray-500 dark:text-gray-300 mb-8">
          Bring your own API key from OpenAI, Anthropic, or Google. Your key is encrypted and never
          shared.
        </p>

        <label
          htmlFor="api-key-input"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
        >
          API Key
        </label>
        <input
          id="api-key-input"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent mb-8"
        />

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => nav('/onboarding/experience')}
            className="px-6 py-4"
          >
            Back
          </Button>
          <Button variant="primary" onClick={next} fullWidth className="py-4">
            {key ? 'Save & Continue' : 'Skip for now'}
          </Button>
        </div>
      </div>
    </div>
  );
}
