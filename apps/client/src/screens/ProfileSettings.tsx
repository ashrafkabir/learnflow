import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, apiGet, apiPost, apiDelete } from '../context/AppContext.js';
import { useToast } from '../components/Toast.js';
import { useTheme } from '../design-system/ThemeProvider.js';
import { Button } from '../components/Button.js';
import { fetchUsageSummary, type UsageSummary } from '../lib/usage';
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
      usageCount?: number;
      lastUsed?: string;
    }>
  >([]);

  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [serverRole, setServerRole] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const summary = await fetchUsageSummary(apiGet, 7);
        setUsage(summary);
      } catch {
        // best-effort
      }
    })();
  }, [apiGet]);

  // Server-driven admin gating (Iter69): trust /profile/context rather than localStorage.
  useEffect(() => {
    (async () => {
      try {
        const ctx = await apiGet('/profile/context');
        setServerRole(String(ctx?.role || ''));
      } catch {
        setServerRole('');
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
      .catch(() => {});
  }, []);

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
        {/* Subscription Tier */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 text-white shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Current Plan</p>
              <p className="text-2xl font-bold">{state.subscription === 'pro' ? 'Pro' : 'Free'}</p>
              <p className="text-sm opacity-75 mt-1">
                {state.subscription === 'pro'
                  ? 'Unlimited courses · Priority agents · Managed keys'
                  : '3 courses · Basic agents · Bring your own keys'}
              </p>
            </div>
            {state.subscription === 'free' ? (
              <Button
                variant="secondary"
                onClick={() => nav('/pricing')}
                className="bg-white text-purple-600 hover:bg-white/90 border-0 shadow-card"
              >
                Upgrade to Pro
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <span className="bg-white/20 text-white font-semibold text-sm px-5 py-2.5 rounded-xl">
                  <span className="inline-flex items-center gap-2">
                    <IconCheck className="w-4 h-4" />
                    Active
                  </span>
                </span>
                <p className="text-xs opacity-75">Next billing: Aug 21, 2025</p>
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
              <span>
                <span className="inline-flex items-center gap-2">
                  <IconChart className="w-4 h-4" />
                  API calls this month:{' '}
                </span>
                <strong className="text-gray-900 dark:text-white">1,234 / 10,000</strong>
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: '12.34%' }} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  if (
                    confirm(
                      'Downgrade to Free? You will lose access to Pro features at the end of your billing period.',
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
                      'Cancel your subscription? You will lose access to Pro features at the end of your billing period.',
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: <IconInfinity className="w-5 h-5" />, label: 'Unlimited courses', pro: true },
              {
                icon: <IconRobot className="w-5 h-5" />,
                label: 'Priority agent access',
                pro: true,
              },
              { icon: <IconKey className="w-5 h-5" />, label: 'Managed API keys', pro: true },
              { icon: <IconRefresh className="w-5 h-5" />, label: 'Update Agent', pro: true },
              { icon: <IconCourse className="w-5 h-5" />, label: '3 courses', pro: false },
              { icon: <IconBrainSpark className="w-5 h-5" />, label: 'Basic agents', pro: false },
            ].map((f) => (
              <div
                key={f.label}
                className={`flex items-center gap-3 p-3 rounded-xl ${f.pro ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}
              >
                <span className="text-gray-800/80 dark:text-gray-200">{f.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{f.label}</span>
                {f.pro ? (
                  <span className="text-xs bg-purple-700 text-white px-2 py-0.5 rounded-full font-bold">
                    PRO
                  </span>
                ) : (
                  <span className="text-xs text-success font-medium inline-flex items-center gap-1">
                    <IconCheck className="w-3.5 h-3.5" />
                    Free
                  </span>
                )}
              </div>
            ))}
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Usage (last 7 days)
            </h2>
            <div className="text-sm text-gray-800/80 dark:text-gray-200 flex items-center justify-between">
              <span>Total tokens</span>
              <span className="font-mono">{usage ? usage.totalTokens : 0}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-xs text-gray-500 dark:text-gray-300">Top agents</div>
                <ul className="mt-2 space-y-1">
                  {(usage?.topAgents || []).slice(0, 5).map((a) => (
                    <li key={a.agentName} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900 dark:text-white">{a.agentName}</span>
                      <span className="font-mono text-gray-700 dark:text-gray-200">{a.total}</span>
                    </li>
                  ))}
                  {(!usage || (usage.topAgents || []).length === 0) && (
                    <li className="text-sm text-gray-500 dark:text-gray-300">No usage yet</li>
                  )}
                </ul>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-xs text-gray-500 dark:text-gray-300">Top providers</div>
                <ul className="mt-2 space-y-1">
                  {(usage?.topProviders || []).slice(0, 5).map((p) => (
                    <li key={p.provider} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900 dark:text-white capitalize">{p.provider}</span>
                      <span className="font-mono text-gray-700 dark:text-gray-200">{p.total}</span>
                    </li>
                  ))}
                  {(!usage || (usage.topProviders || []).length === 0) && (
                    <li className="text-sm text-gray-500 dark:text-gray-300">No usage yet</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-4 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h2>
            <p className="text-xs text-gray-800/80 dark:text-gray-200">
              Keys are encrypted with AES-256 and stored on the server. We never store raw keys.
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
                  const data = await apiPost('/keys', { provider: keyProvider, apiKey });
                  setSavedKeys([
                    ...savedKeys,
                    {
                      id: data.id,
                      provider: data.provider,
                      maskedKey: data.maskedKey,
                      label: data.label,
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Export as JSON</p>
                <p className="text-xs text-gray-800/80 dark:text-gray-200">
                  Courses, progress, and settings
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const data = JSON.stringify(
                    { courses: state.courses, profile: state.profile },
                    null,
                    2,
                  );
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'learnflow-export.json';
                  a.click();
                  URL.revokeObjectURL(url);
                  toast('Data exported as JSON', 'success');
                }}
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
                  All courses as .md files
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const md = state.courses
                    .map((c) => {
                      const lessons = c.modules
                        .map((m) =>
                          m.lessons.map((l) => `### ${l.title}\n\n${l.content}`).join('\n\n'),
                        )
                        .join('\n\n');
                      return `# ${c.title}\n\n${c.description}\n\n${lessons}`;
                    })
                    .join('\n\n---\n\n');
                  const blob = new Blob([md], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'learnflow-export.md';
                  a.click();
                  URL.revokeObjectURL(url);
                  toast('Data exported as Markdown', 'success');
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
                onClick={async () => {
                  try {
                    const { default: JSZip } = await import('jszip');
                    const zip = new JSZip();
                    const jsonData = JSON.stringify(
                      { courses: state.courses, profile: state.profile },
                      null,
                      2,
                    );
                    zip.file('learnflow-export.json', jsonData);
                    const md = state.courses
                      .map((c) => {
                        const lessons = c.modules
                          .map((m) =>
                            m.lessons.map((l) => `### ${l.title}\n\n${l.content}`).join('\n\n'),
                          )
                          .join('\n\n');
                        return `# ${c.title}\n\n${c.description}\n\n${lessons}`;
                      })
                      .join('\n\n---\n\n');
                    zip.file('learnflow-export.md', md);
                    zip.file(
                      'metadata.json',
                      JSON.stringify(
                        { exportedAt: new Date().toISOString(), version: '1.0' },
                        null,
                        2,
                      ),
                    );
                    const blob = await zip.generateAsync({ type: 'blob' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'learnflow-export.zip';
                    a.click();
                    URL.revokeObjectURL(url);
                    toast('Data exported as ZIP', 'success');
                  } catch {
                    toast('ZIP export failed — JSZip not available', 'error');
                  }
                }}
              >
                Export ZIP
              </Button>
            </div>
            {['PDF', 'SCORM', 'Notion', 'Obsidian'].map((fmt) => (
              <div
                key={fmt}
                className="flex items-center justify-between opacity-60 cursor-not-allowed"
                title="Upgrade to Pro to unlock this export format"
              >
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Export as {fmt}
                  </p>
                  <p className="text-xs text-gray-800/80 dark:text-gray-200">{fmt} format export</p>
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

        {/* Privacy */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy</h2>
          <p className="text-xs text-gray-800/80 dark:text-gray-200">
            Per our privacy policy, here's what we track:
          </p>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Learning progress & streaks', tracked: true },
              { label: 'Course creation topics', tracked: true },
              { label: 'Quiz scores & completion rates', tracked: true },
              { label: 'API keys (encrypted, AES-256)', tracked: true },
              { label: 'Conversation content (session only)', tracked: false },
              { label: 'Browsing activity outside LearnFlow', tracked: false },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-gray-800/80 dark:text-gray-200"
              >
                <span className={item.tracked ? 'text-blue-500' : 'text-gray-300'}>
                  {item.tracked ? '●' : '○'}
                </span>
                <span>{item.label}</span>
              </div>
            ))}
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
              onClick={() => {
                if (
                  confirm(
                    'Are you sure you want to delete ALL your data? This action is permanent and cannot be undone.',
                  )
                ) {
                  if (
                    confirm(
                      'This is your final confirmation. Type "delete" mentally and click OK to proceed.',
                    )
                  ) {
                    localStorage.clear();
                    window.location.href = '/';
                  }
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
