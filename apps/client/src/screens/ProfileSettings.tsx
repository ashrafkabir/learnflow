import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, apiGet, apiPost, apiDelete } from '../context/AppContext.js';
import { useToast } from '../components/Toast.js';
import { useTheme } from '../design-system/ThemeProvider.js';
import { Button } from '../components/Button.js';
import { fetchUsageDashboard, type UsageDashboard } from '../lib/usage';
import {
  IconBrainSpark,
  IconChart,
  IconCheck,
  IconCourse,
  IconInfinity,
  IconKey,
  IconRefresh,
  IconRobot,
} from '../components/icons/index.js';
import { AdminSearchConfigPanel } from '../components/AdminSearchConfigPanel.js';
import { UpdateAgentSettingsPanel } from '../components/update-agent/UpdateAgentSettingsPanel.js';

export function ProfileSettings() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();
  const { profile } = state;
  const { toast } = useToast();
  const { mode: themeMode, toggle: toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedKeys, setSavedKeys] = useState<
    Array<{
      id: string;
      provider: string;
      maskedKey: string;
      label: string;
      validationStatus?: 'unknown' | 'valid' | 'invalid';
      validatedAt?: string;
      usageCount?: number;
      lastUsed?: string;
    }>
  >([]);

  const [usage, setUsage] = useState<UsageDashboard | null>(null);
  const [usageRange, setUsageRange] = useState<7 | 30 | 90>(7);
  const [serverRole, setServerRole] = useState<string>('');

  const [dataSummary, setDataSummary] = useState<any>(null);
  const [dataSummaryLoading, setDataSummaryLoading] = useState(false);
  const [dataSummaryError, setDataSummaryError] = useState<string>('');

  const [telemetryEnabled, setTelemetryEnabled] = useState(true);
  const [telemetrySaving, setTelemetrySaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const dash = await fetchUsageDashboard(apiGet, usageRange);
        setUsage(dash);
      } catch {
        // best-effort
      }
    })();
  }, [apiGet, usageRange]);

  const loadDataSummary = React.useCallback(async () => {
    setDataSummaryError('');
    setDataSummaryLoading(true);
    try {
      const res = await apiGet('/profile/data-summary');
      setDataSummary(res);
    } catch (e: any) {
      setDataSummary(null);
      setDataSummaryError(String(e?.message || 'Failed to load data summary'));
    } finally {
      setDataSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDataSummary();
  }, [loadDataSummary]);

  // Server-driven admin gating + privacy defaults (Iter69/101)
  useEffect(() => {
    (async () => {
      try {
        const ctx = await apiGet('/profile/context');
        setServerRole(String(ctx?.role || ''));
        setTelemetryEnabled(Boolean(ctx?.preferences?.telemetryEnabled ?? true));
      } catch {
        setServerRole('');
        setTelemetryEnabled(true);
      }
    })();
  }, []);

  const [keyProvider, setKeyProvider] = useState<string>('openai');

  // Fetch saved keys from server on mount
  React.useEffect(() => {
    apiGet('/keys')
      .then((data) => {
        if (data?.keys) setSavedKeys(data.keys);
      })
      .catch(() => {
        toast('Could not load your saved API keys.', 'error');
      });
  }, [toast]);

  const update = (partial: Partial<typeof profile>) => {
    dispatch({ type: 'UPDATE_PROFILE', profile: partial });
  };

  const [highContrast, setHighContrast] = useState(
    () => localStorage.getItem('learnflow-contrast') === 'true',
  );

  const toggleDarkMode = () => {
    toggleTheme();
    update({ darkMode: themeMode !== 'dark' });
  };

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    localStorage.setItem('learnflow-contrast', String(next));
    document.documentElement.classList.toggle('high-contrast', next);
  };

  return (
    <section
      aria-label="Profile Settings"
      data-screen="settings"
      aria-live="polite"
      className="min-h-screen bg-bg dark:bg-bg-dark"
    >
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => nav('/dashboard')}>
            ←
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Want the no-fluff version of what this build does?
          </p>
          <Button variant="ghost" size="sm" onClick={() => nav('/settings/about')} className="mt-2">
            About this MVP →
          </Button>
        </div>
        {/* Subscription Tier */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 text-white shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Current Plan</p>
              <p className="text-2xl font-bold">{state.subscription === 'pro' ? 'Pro' : 'Free'}</p>
              <p className="text-sm opacity-75 mt-1">
                {state.subscription === 'pro'
                  ? 'Unlimited courses · Priority agents · Proactive updates'
                  : '3 courses · Basic agents · Bring your own keys'}
              </p>
            </div>
            {state.subscription === 'free' ? (
              <div className="flex flex-col items-end">
                <a
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 bg-white text-purple-600 hover:bg-white/90 border-0 shadow-card font-medium text-sm"
                >
                  Upgrade to Pro
                </a>
                <p className="mt-2 text-xs opacity-90">
                  Billing is in mock mode in this MVP (no real charges).
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <span className="bg-white/20 text-white font-semibold text-sm px-5 py-2.5 rounded-xl">
                  <span className="inline-flex items-center gap-2">
                    <IconCheck className="w-4 h-4" />
                    Active
                  </span>
                </span>
                <p className="text-xs opacity-75">
                  Billing is in mock mode in this MVP (no real charges).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Management */}
        {state.subscription === 'pro' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Subscription Management
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-800/80 dark:text-gray-200">
              <span className="inline-flex items-center gap-2">
                <IconChart className="w-4 h-4" />
                Usage is shown below (best-effort; based on server-stored usage records).
              </span>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  if (
                    confirm(
                      'Downgrade to Free? (MVP mock billing) This does not affect any real payments. Pro features will be disabled immediately in this sandbox.',
                    )
                  ) {
                    try {
                      await apiPost('/subscription', { action: 'downgrade', plan: 'free' });
                      dispatch({ type: 'SET_SUBSCRIPTION', tier: 'free' });
                      toast('Downgraded to Free plan', 'success');
                    } catch {
                      toast('Failed to downgrade', 'error');
                    }
                  }
                }}
              >
                Downgrade to Free
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  if (
                    confirm(
                      'Cancel your subscription? (MVP mock billing) This does not cancel any real payments. Pro features will be disabled immediately in this sandbox.',
                    )
                  ) {
                    try {
                      await apiPost('/subscription', { action: 'cancel' });
                      dispatch({ type: 'SET_SUBSCRIPTION', tier: 'free' });
                      toast('Subscription cancelled', 'success');
                    } catch {
                      toast('Failed to cancel subscription', 'error');
                    }
                  }
                }}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        )}

        {/* Pro Features Preview */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pro Features</h2>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Feature availability is server-driven (capabilities matrix).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: <IconInfinity className="w-5 h-5" />,
                label: 'Unlimited courses',
                cap: 'courses.unlimited',
              },
              {
                icon: <IconRobot className="w-5 h-5" />,
                label: 'Priority agent access',
                cap: 'agents.priority',
              },
              {
                icon: <IconKey className="w-5 h-5" />,
                label: 'Managed API keys',
                cap: 'keys.managed',
                note: 'Coming soon',
              },
              {
                icon: <IconRefresh className="w-5 h-5" />,
                label: 'Update Agent',
                cap: 'update_agent',
              },
              {
                icon: <IconCourse className="w-5 h-5" />,
                label: '3 courses',
                cap: 'courses.unlimited',
              },
              {
                icon: <IconBrainSpark className="w-5 h-5" />,
                label: 'Basic agents',
                cap: 'agents.priority',
              },
            ].map((f) => {
              const enabled = Boolean(state.capabilities?.[f.cap]);
              // “Pro features” preview: enabled means this capability is available on the current plan/deployment.
              return (
                <div
                  key={f.label}
                  className={`flex items-center gap-3 p-3 rounded-xl ${enabled ? 'bg-gray-50 dark:bg-gray-800' : 'bg-purple-50 dark:bg-purple-900/20'}`}
                >
                  <span className="text-gray-800/80 dark:text-gray-200">{f.icon}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {f.label}{' '}
                    {f.note ? (
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        ({f.note})
                      </span>
                    ) : null}
                  </span>
                  {enabled ? (
                    <span className="text-xs text-success font-medium inline-flex items-center gap-1">
                      <IconCheck className="w-3.5 h-3.5" />
                      Enabled
                    </span>
                  ) : (
                    <span className="text-xs bg-purple-700 text-white px-2 py-0.5 rounded-full font-bold">
                      PRO
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-col grid: Profile + API Keys */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profile */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-800/80 dark:text-gray-200">Name</span>
                <input
                  value={profile.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-800/80 dark:text-gray-200">Email</span>
                <input
                  value={profile.email}
                  onChange={(e) => update({ email: e.target.value })}
                  type="email"
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
            </div>
            <Button
              variant="primary"
              fullWidth
              onClick={async () => {
                setSaving(true);
                try {
                  localStorage.setItem('learnflow-profile', JSON.stringify(profile));
                  await new Promise((r) => setTimeout(r, 500));
                  toast('Profile saved successfully', 'success');
                } catch {
                  toast('Failed to save profile', 'error');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>

          {/* Usage */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-3 flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Usage</h2>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 dark:text-gray-300" htmlFor="usage-range">
                  Range
                </label>
                <select
                  id="usage-range"
                  className="text-sm px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  value={usageRange}
                  onChange={(e) => setUsageRange(Number(e.target.value) as 7 | 30 | 90)}
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-800/80 dark:text-gray-200 flex items-center justify-between">
              <span>Total tokens</span>
              <span className="font-mono">{usage ? usage.totalTokens : 0}</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Usage is tracked on a best-effort basis from server-stored usage records.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-xs text-gray-500 dark:text-gray-300">Top agents</div>
                <ul className="mt-2 space-y-1">
                  {(usage?.byAgent || []).slice(0, 5).map((a) => (
                    <li key={a.agentName} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900 dark:text-white">{a.agentName}</span>
                      <span className="font-mono text-gray-700 dark:text-gray-200">{a.total}</span>
                    </li>
                  ))}
                  {(!usage || (usage.byAgent || []).length === 0) && (
                    <li className="text-sm text-gray-500 dark:text-gray-300">No usage yet</li>
                  )}
                </ul>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-xs text-gray-500 dark:text-gray-300">Top providers</div>
                <ul className="mt-2 space-y-1">
                  {(usage?.byProvider || []).slice(0, 5).map((p) => (
                    <li key={p.provider} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900 dark:text-white capitalize">{p.provider}</span>
                      <span className="font-mono text-gray-700 dark:text-gray-200">{p.total}</span>
                    </li>
                  ))}
                  {(!usage || (usage.byProvider || []).length === 0) && (
                    <li className="text-sm text-gray-500 dark:text-gray-300">No usage yet</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Update Agent */}
          <UpdateAgentSettingsPanel />

          {/* API Keys */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-4 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h2>
            <p className="text-xs text-gray-800/80 dark:text-gray-200">
              Keys are encrypted at rest on the server (AES-256-GCM, AEAD). We never store raw keys.
            </p>

            {/* Saved keys with usage stats — Task 12 */}
            {savedKeys.length > 0 && (
              <div className="space-y-2">
                {savedKeys.map((k) => (
                  <div key={k.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {k.provider}
                        </span>
                        <span className="ml-2 text-xs text-gray-800/80 dark:text-gray-200 font-mono">
                          {k.maskedKey}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await apiDelete(`/keys/${k.provider}`);
                            setSavedKeys(savedKeys.filter((sk) => sk.provider !== k.provider));
                            toast('Key removed', 'success');
                          } catch {
                            toast('Failed to remove key', 'error');
                          }
                        }}
                        className="text-red-700 hover:text-red-800"
                      >
                        Remove
                      </Button>
                    </div>
                    {/* Usage stats — Task 12 */}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-300">
                      <span className="inline-flex items-center gap-1">
                        <IconChart className="w-4 h-4" />
                        Used {k.usageCount ?? 0} times this month
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"
                          aria-hidden="true"
                        />
                        Last used:{' '}
                        {k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : 'Never'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            k.validationStatus === 'valid'
                              ? 'bg-green-500'
                              : k.validationStatus === 'invalid'
                                ? 'bg-red-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                          aria-hidden="true"
                        />
                        Key:{' '}
                        {k.validationStatus === 'valid'
                          ? 'Validated'
                          : k.validationStatus === 'invalid'
                            ? 'Invalid'
                            : 'Not validated'}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${Math.min(((k.usageCount ?? 0) / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new key */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-800/80 dark:text-gray-200">Provider</span>
                <select
                  value={keyProvider}
                  onChange={(e) => setKeyProvider(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="mistral">Mistral</option>
                  <option value="groq">Groq</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-gray-800/80 dark:text-gray-200">API Key</span>
                <div className="flex gap-2 mt-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="••••••••••••••••••••"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent font-mono"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowKey(!showKey)}
                    title={showKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </label>
            </div>
            <Button
              variant="primary"
              fullWidth
              onClick={async () => {
                if (!apiKey.trim()) return;
                try {
                  const data = await apiPost('/keys', {
                    provider: keyProvider,
                    apiKey,
                    validate: true,
                  });
                  setSavedKeys([
                    ...savedKeys,
                    {
                      id: data.id,
                      provider: data.provider,
                      maskedKey: data.maskedKey,
                      label: data.label,
                      validationStatus: data.validationStatus,
                      validatedAt: data.validatedAt,
                      usageCount: 0,
                      lastUsed: undefined,
                    },
                  ]);
                  setApiKey('');
                  toast('API key saved securely', 'success');
                } catch {
                  toast('Failed to save key', 'error');
                }
              }}
              disabled={!apiKey.trim()}
              className="mt-auto"
            >
              Save Key Securely
            </Button>
          </div>
        </div>
        {/* end 2-col grid */}

        {/* 2-col grid: Learning + Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Learning */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Learning Preferences
            </h2>
            <label className="block">
              <span className="text-sm text-gray-800/80 dark:text-gray-200">
                Daily Goal (minutes)
              </span>
              <input
                type="number"
                value={profile.dailyGoal}
                onChange={(e) => update({ dailyGoal: parseInt(e.target.value) || 0 })}
                min={5}
                max={240}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-800/80 dark:text-gray-200">Experience Level</span>
              <select
                value={profile.experience}
                onChange={(e) => update({ experience: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          </div>

          {/* Toggles */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
              <Button
                variant="ghost"
                onClick={toggleDarkMode}
                className={`relative w-11 h-6 p-0 rounded-full transition-colors ${profile.darkMode ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
                role="switch"
                aria-label="Toggle dark mode"
                aria-checked={profile.darkMode}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${profile.darkMode ? 'translate-x-5' : ''}`}
                />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">High Contrast</span>
              <Button
                variant="ghost"
                onClick={toggleHighContrast}
                className={`relative w-11 h-6 p-0 rounded-full transition-colors ${highContrast ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
                role="switch"
                aria-label="Toggle high contrast"
                aria-checked={highContrast}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${highContrast ? 'translate-x-5' : ''}`}
                />
              </Button>
            </div>
            <div className="space-y-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notifications
              </span>
              {[
                { key: 'notifications', label: 'Push notifications' },
                { key: 'notifCourseComplete', label: 'Email notification for course completion' },
                { key: 'notifDailyReminder', label: 'Daily notification reminders' },
                { key: 'notifMarketplace', label: 'Marketplace notification digest' },
                { key: 'notifAgentActivity', label: 'Agent activity notification alerts' },
                { key: 'notifWeeklyDigest', label: 'Weekly learning notification summary' },
                { key: 'notifPeerCollab', label: 'Peer collaboration notification invites' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between pl-2">
                  <span className="text-sm text-gray-800/80 dark:text-gray-200">{label}</span>
                  <Button
                    variant="ghost"
                    onClick={() => update({ [key]: !(profile as any)[key] } as any)}
                    className={`relative w-11 h-6 p-0 rounded-full transition-colors ${(profile as any)[key] ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
                    role="switch"
                    aria-label={label}
                    aria-checked={Boolean((profile as any)[key])}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${(profile as any)[key] ? 'translate-x-5' : ''}`}
                    />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* end 2-col grid */}

        {/* Learning Goals & Interests */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Learning Goals &amp; Interests
          </h2>
          <label className="block">
            <span className="text-sm text-gray-800/80 dark:text-gray-200">Primary Goal</span>
            <input
              value={(profile as any).primaryGoal || ''}
              onChange={(e) => update({ primaryGoal: e.target.value } as any)}
              placeholder="e.g., Master machine learning fundamentals"
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-800/80 dark:text-gray-200">Secondary Goal</span>
            <input
              value={(profile as any).secondaryGoal || ''}
              onChange={(e) => update({ secondaryGoal: e.target.value } as any)}
              placeholder="e.g., Build a portfolio project"
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-800/80 dark:text-gray-200">
              Interests (comma-separated)
            </span>
            <input
              value={(profile as any).interests || ''}
              onChange={(e) => update({ interests: e.target.value } as any)}
              placeholder="e.g., AI, Web Development, Data Science"
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-800/80 dark:text-gray-200">Target Timeline</span>
            <select
              value={(profile as any).targetTimeline || '3months'}
              onChange={(e) => update({ targetTimeline: e.target.value } as any)}
              className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="1month">1 month</option>
              <option value="3months">3 months</option>
              <option value="6months">6 months</option>
              <option value="1year">1 year</option>
            </select>
          </label>
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              localStorage.setItem('learnflow-profile', JSON.stringify(profile));
              toast('Goals updated successfully', 'success');
            }}
          >
            Update Goals
          </Button>
        </div>

        {/* Data Export */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Export</h2>
          <p className="text-xs text-gray-800/80 dark:text-gray-200">
            Exports are generated by the server (source of truth). Free tier supports Markdown only.
            Exports include lesson sources (and credibility fields when available).
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Export as JSON</p>
                <p className="text-xs text-gray-800/80 dark:text-gray-200">
                  Courses, notes, and profile metadata
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Server is the source of truth.
                  window.location.href = '/api/v1/export?format=json';
                }}
                disabled={state.subscription !== 'pro'}
                title={state.subscription === 'pro' ? 'Download JSON export' : 'Upgrade to Pro'}
              >
                Export JSON
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Export as Markdown
                </p>
                <p className="text-xs text-gray-800/80 dark:text-gray-200">
                  All courses as a single .md file
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  window.location.href = '/api/v1/export?format=md';
                }}
              >
                Export MD
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Export All Data (ZIP)
                </p>
                <p className="text-xs text-gray-800/80 dark:text-gray-200">
                  Bundle JSON + Markdown + metadata into a ZIP archive
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  window.location.href = '/api/v1/export?format=zip';
                }}
                disabled={state.subscription !== 'pro'}
                title={state.subscription === 'pro' ? 'Download ZIP export' : 'Upgrade to Pro'}
              >
                Export ZIP
              </Button>
            </div>

            {state.subscription !== 'pro' ? (
              <div className="text-xs text-gray-600 dark:text-gray-300">
                JSON and ZIP exports require Pro.
              </div>
            ) : null}

            {['Notion', 'Obsidian', 'PDF', 'SCORM'].map((fmt) => (
              <div
                key={fmt}
                className="flex items-center justify-between opacity-60 cursor-not-allowed"
                title="Coming soon"
              >
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Export as {fmt}
                  </p>
                  <p className="text-xs text-gray-800/80 dark:text-gray-200">{fmt} export</p>
                </div>
                <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">
                  PRO
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin (server-driven) */}
        {serverRole === 'admin' ? <AdminSearchConfigPanel /> : null}

        {/* Dev-only cleanup (Iter86) */}
        {serverRole === 'admin' && (window as any)?.location?.hostname !== 'test' ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dev: Cleanup harness data
            </h2>
            <p className="text-xs text-gray-800/80 dark:text-gray-200">
              Deletes server data created by harness/screenshot runs (origin=harness). This is
              guarded and requires explicit confirmation.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    // Use harness origin so backend accepts the request.
                    localStorage.setItem('learnflow-origin', 'harness');
                    const res = await apiPost('/admin/cleanup', {
                      origin: 'harness',
                      dryRun: true,
                    });
                    toast(
                      `Dry-run: ${Object.entries(res?.result?.tables || {}).length} tables scanned`,
                      'success',
                    );
                  } catch (e: any) {
                    toast(String(e?.message || 'Dry-run failed'), 'error');
                  }
                }}
              >
                Dry-run
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  const ok = window.confirm(
                    'This will DELETE harness-origin data from the local/dev DB. Type OK to continue.',
                  );
                  if (!ok) return;
                  const confirm = window.prompt('Type DELETE to confirm');
                  if (confirm !== 'DELETE') return;
                  try {
                    localStorage.setItem('learnflow-origin', 'harness');
                    await apiPost('/admin/cleanup', {
                      origin: 'harness',
                      dryRun: false,
                      confirm: 'DELETE',
                    });
                    toast('Cleanup completed', 'success');
                    loadDataSummary();
                  } catch (e: any) {
                    toast(String(e?.message || 'Cleanup failed'), 'error');
                  }
                }}
              >
                Delete harness data
              </Button>
            </div>
          </div>
        ) : null}

        {/* Privacy */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy</h2>
          <p className="text-xs text-gray-800/80 dark:text-gray-200">
            Control server-side learning telemetry (used for streaks, progress summaries, and
            quality diagnostics). This MVP does not track browsing outside LearnFlow.
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Learning telemetry
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-300">
                  When enabled, we store lesson view + completion events on the server. Used to
                  compute streaks and improve reliability.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200 select-none">
                <input
                  type="checkbox"
                  checked={telemetryEnabled}
                  onChange={async (e) => {
                    const next = Boolean(e.target.checked);
                    setTelemetryEnabled(next);
                    setTelemetrySaving(true);
                    try {
                      await apiPost('/profile/privacy', { telemetryEnabled: next });
                      toast('Privacy settings saved', 'success');
                      loadDataSummary();
                    } catch {
                      setTelemetryEnabled(!next);
                      toast('Failed to save privacy settings', 'error');
                    } finally {
                      setTelemetrySaving(false);
                    }
                  }}
                />
                <span>{telemetrySaving ? 'Saving…' : telemetryEnabled ? 'On' : 'Off'}</span>
              </label>
            </div>

            <div className="space-y-2 text-xs text-gray-700 dark:text-gray-200">
              {[
                { label: 'Learning progress & streaks', tracked: true },
                { label: 'Course creation topics', tracked: true },
                { label: 'Quiz scores & completion rates', tracked: false },
                { label: 'API keys (encrypted at rest, AES-256-GCM)', tracked: true },
                { label: 'Conversation content (session only)', tracked: false },
                { label: 'Browsing activity outside LearnFlow', tracked: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={item.tracked ? 'text-blue-500' : 'text-gray-300'}>
                    {item.tracked ? '●' : '○'}
                  </span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Your data on our servers
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-300">
                  Live summary of server-stored records (counts + last updated).
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={loadDataSummary}
                disabled={dataSummaryLoading}
              >
                <span className="inline-flex items-center gap-1">
                  <IconRefresh className="w-4 h-4" />
                  {dataSummaryLoading ? 'Loading…' : 'Refresh'}
                </span>
              </Button>
            </div>

            {dataSummaryLoading && (
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-300">Loading…</div>
            )}

            {!dataSummaryLoading && dataSummaryError && (
              <div className="mt-3 p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
                <p className="text-sm text-red-700 dark:text-red-300">{dataSummaryError}</p>
                <div className="mt-2">
                  <Button variant="secondary" size="sm" onClick={loadDataSummary}>
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {!dataSummaryLoading && !dataSummaryError && dataSummary && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  {
                    label: 'Learning events',
                    count: dataSummary.learningEvents?.count,
                    last: dataSummary.learningEvents?.lastEventAt,
                    note: 'Server-stored telemetry',
                  },
                  {
                    label: 'Completed lessons',
                    count: dataSummary.progress?.completedCount,
                    last: dataSummary.progress?.lastCompletedAt,
                    note: 'Server-stored progress',
                  },
                  {
                    label: 'Usage records',
                    count: dataSummary.usageRecords?.count,
                    last: dataSummary.usageRecords?.lastUsedAt,
                    note: 'Server-stored usage',
                  },
                  {
                    label: 'Notifications',
                    count: dataSummary.notifications?.count,
                    last: dataSummary.notifications?.lastNotificationAt,
                    note: 'Server-stored messages',
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{row.label}</span>
                      <span className="font-mono text-gray-700 dark:text-gray-200">
                        {typeof row.count === 'number' ? row.count : 0}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                      Last updated: {row.last ? new Date(row.last).toLocaleString() : 'Never'}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-300">
                      {row.note}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!dataSummaryLoading &&
              !dataSummaryError &&
              dataSummary &&
              Number(dataSummary.learningEvents?.count || 0) === 0 &&
              Number(dataSummary.progress?.completedCount || 0) === 0 &&
              Number(dataSummary.usageRecords?.count || 0) === 0 &&
              Number(dataSummary.notifications?.count || 0) === 0 && (
                <div className="mt-3 text-sm text-gray-500 dark:text-gray-300">
                  No server-stored activity yet.
                </div>
              )}

            <div className="mt-3 text-xs text-gray-500 dark:text-gray-300">
              Local-only: conversation content and temporary UI state stored in your browser. Use
              your browser settings to clear local storage.
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl border-2 border-red-200 dark:border-red-800/50 p-6 space-y-4">
          <div className="border-b border-red-200 dark:border-red-800/40 pb-3">
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
              These actions are permanent and cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Delete All Data</p>
              <p className="text-xs text-gray-800/80 dark:text-gray-200">
                Permanently delete all your data (GDPR)
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                if (
                  !confirm(
                    'Delete ALL your server-stored data? This cannot be undone and may remove courses, notes, usage records, notifications, Update Agent settings, and collaboration messages/groups you own. Some memberships in other groups may persist until those owners remove you.',
                  )
                ) {
                  return;
                }

                const confirmText = window.prompt('Type DELETE to confirm');
                if (confirmText !== 'DELETE') return;

                try {
                  await apiDelete('/delete-my-data');
                  // Best-effort local cleanup after server deletion.
                  localStorage.clear();
                  window.location.href = '/';
                } catch {
                  toast('Failed to delete your data. Please try again.', 'error');
                }
              }}
            >
              Delete My Data
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
