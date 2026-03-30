import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, apiPost } from '../../context/AppContext.js';
import { OnboardingProgress } from '../../components/OnboardingProgress.js';
import { Button } from '../../components/Button.js';
import { useToast } from '../../components/Toast.js';

type KeyProvider = 'openai' | 'anthropic' | 'google' | 'mistral' | 'groq' | 'ollama';

export function OnboardingApiKeys() {
  const nav = useNavigate();
  const { dispatch } = useApp();
  const { toast } = useToast();

  const [provider, setProvider] = useState<KeyProvider>('openai');
  const [key, setKey] = useState('');
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => key.trim().length > 0, [key]);

  const next = () => {
    dispatch({ type: 'SET_ONBOARDING_STEP', step: 4 });
    nav('/onboarding/subscription');
  };

  const validateKey = async (): Promise<boolean> => {
    setValidating(true);
    try {
      await apiPost('/keys/validate', { provider, apiKey: key.trim() });
      return true;
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as any).message)
          : 'Invalid API key';
      toast(msg.includes('Invalid') ? msg : 'Invalid API key', 'error');
      return false;
    } finally {
      setValidating(false);
    }
  };

  const saveKey = async () => {
    if (!canSave) return;

    // Optional validation: run basic provider format validation for a clearer UX.
    const ok = await validateKey();
    if (!ok) return;

    setSaving(true);
    try {
      await apiPost('/keys', { provider, apiKey: key.trim() });

      toast('API key saved securely', 'success');
      setKey('');
      next();
    } catch {
      toast('Failed to save key', 'error');
    } finally {
      setSaving(false);
    }
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
          Bring your own API key from OpenAI, Anthropic, Google, Mistral, Groq, or Ollama. Your key
          is encrypted and never shared.
        </p>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Provider
            </span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as KeyProvider)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="mistral">Mistral</option>
              <option value="groq">Groq</option>
              <option value="ollama">Ollama (local)</option>
            </select>
          </label>

          <label htmlFor="api-key-input" className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              API Key
            </span>
            <input
              id="api-key-input"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={
                provider === 'anthropic'
                  ? 'sk-ant-...'
                  : provider === 'google'
                    ? 'AI...'
                    : provider === 'groq'
                      ? 'gsk_...'
                      : provider === 'ollama'
                        ? 'optional (local)'
                        : provider === 'mistral'
                          ? 'mistral key...'
                          : 'sk-...'
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              We&apos;ll validate the key format and store it encrypted.
            </p>
          </label>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => nav('/onboarding/topics')}
            className="px-6 py-4"
            disabled={saving || validating}
          >
            Back
          </Button>
          <Button
            variant="primary"
            onClick={canSave ? saveKey : next}
            fullWidth
            className="py-4"
            disabled={saving || validating}
          >
            {canSave
              ? saving
                ? 'Saving…'
                : validating
                  ? 'Validating…'
                  : 'Validate, Save & Continue'
              : 'Skip for now'}
          </Button>
        </div>
      </div>
    </div>
  );
}
