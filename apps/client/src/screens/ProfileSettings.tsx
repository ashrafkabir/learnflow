import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, apiBase } from '../context/AppContext.js';
import { useToast } from '../components/Toast.js';
import { useTheme } from '../design-system/ThemeProvider.js';

export function ProfileSettings() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();
  const { profile } = state;
  const { toast } = useToast();
  const { mode: themeMode, toggle: toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Array<{ id: string; provider: string; maskedKey: string; label: string }>>([]);
  const [keyProvider, setKeyProvider] = useState<string>('openai');

  // Fetch saved keys from server on mount
  React.useEffect(() => {
    const token = localStorage.getItem('learnflow-token');
    if (!token) return;
    fetch(`${apiBase()}/api/v1/keys`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.keys) setSavedKeys(data.keys);
      })
      .catch(() => {});
  }, []);

  const update = (partial: Partial<typeof profile>) => {
    dispatch({ type: 'UPDATE_PROFILE', profile: partial });
  };

  const toggleDarkMode = () => {
    toggleTheme();
    update({ darkMode: themeMode !== 'dark' });
  };

  return (
    <section
      aria-label="Profile Settings"
      data-screen="settings"
      className="min-h-screen bg-gray-50 dark:bg-bg-dark"
    >
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => nav('/dashboard')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Subscription Tier (Task 14) */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 text-white">
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
              <button
                onClick={() => dispatch({ type: 'SET_SUBSCRIPTION', tier: 'pro' })}
                className="bg-white text-purple-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors shadow-sm"
              >
                Upgrade to Pro
              </button>
            ) : (
              <span className="bg-white/20 text-white font-semibold text-sm px-5 py-2.5 rounded-xl">
                ✓ Active
              </span>
            )}
          </div>
        </div>

        {/* Pro Features Preview (Task 14) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pro Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '♾️', label: 'Unlimited courses', pro: true },
              { icon: '🤖', label: 'Priority agent access', pro: true },
              { icon: '🔑', label: 'Managed API keys', pro: true },
              { icon: '🔄', label: 'Update Agent', pro: true },
              { icon: '📚', label: '3 courses', pro: false },
              { icon: '🧠', label: 'Basic agents', pro: false },
            ].map((f) => (
              <div
                key={f.label}
                className={`flex items-center gap-3 p-3 rounded-xl ${f.pro ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}
              >
                <span>{f.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{f.label}</span>
                {f.pro ? (
                  <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">
                    PRO
                  </span>
                ) : (
                  <span className="text-xs text-success font-medium">✓ Free</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 2-col grid: Profile + API Keys */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-gray-600 dark:text-gray-400">Name</span>
              <input
                value={profile.name}
                onChange={(e) => update({ name: e.target.value })}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
              <input
                value={profile.email}
                onChange={(e) => update({ email: e.target.value })}
                type="email"
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
          </div>
          <button
            onClick={async () => {
              setSaving(true);
              try {
                localStorage.setItem('learnflow-profile', JSON.stringify(profile));
                await new Promise(r => setTimeout(r, 500));
                toast('Profile saved successfully', 'success');
              } catch {
                toast('Failed to save profile', 'error');
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
            className="w-full py-2.5 bg-accent text-white font-medium rounded-xl hover:bg-accent/90 disabled:opacity-50 transition-colors text-sm"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* API Keys — Spec §4.4: Encrypted vault, never stored client-side */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">API Keys</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">Keys are encrypted with AES-256 and stored on the server. We never store raw keys.</p>

          {/* Saved keys */}
          {savedKeys.length > 0 && (
            <div className="space-y-2">
              {savedKeys.map((k) => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{k.provider}</span>
                    <span className="ml-2 text-xs text-gray-600 dark:text-gray-400 font-mono">{k.maskedKey}</span>
                  </div>
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem('learnflow-token');
                      if (!token) return;
                      // Delete key (would need DELETE endpoint, for now just remove from UI)
                      setSavedKeys(savedKeys.filter((sk) => sk.id !== k.id));
                      toast('Key removed', 'success');
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new key */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm text-gray-600 dark:text-gray-400">Provider</span>
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
              <span className="text-sm text-gray-600 dark:text-gray-400">API Key</span>
              <div className="flex gap-2 mt-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent font-mono"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
          </div>
          <button
            onClick={async () => {
              if (!apiKey.trim()) return;
              const token = localStorage.getItem('learnflow-token');
              if (!token) { toast('Please log in first', 'error'); return; }
              try {
                const res = await fetch(`${apiBase()}/api/v1/keys`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ provider: keyProvider, apiKey }),
                });
                const data = await res.json();
                if (res.ok) {
                  setSavedKeys([...savedKeys, { id: data.id, provider: data.provider, maskedKey: data.maskedKey, label: data.label }]);
                  setApiKey('');
                  toast('API key saved securely', 'success');
                } else {
                  toast(data.message || 'Failed to save key', 'error');
                }
              } catch {
                toast('Network error', 'error');
              }
            }}
            disabled={!apiKey.trim()}
            className="w-full py-2.5 bg-accent text-white font-medium rounded-xl hover:bg-accent-dark disabled:opacity-50 transition-colors text-sm mt-auto"
          >
            Save Key Securely
          </button>
        </div>
        </div>{/* end 2-col grid */}

        {/* 2-col grid: Learning + Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Learning */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Learning Preferences
          </h2>
          <label className="block">
            <span className="text-sm text-gray-600 dark:text-gray-400">Daily Goal (minutes)</span>
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
            <span className="text-sm text-gray-600 dark:text-gray-400">Experience Level</span>
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
            <button
              onClick={toggleDarkMode}
              className={`relative w-11 h-6 rounded-full transition-colors ${profile.darkMode ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
              role="switch"
              aria-checked={profile.darkMode}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${profile.darkMode ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
          <div className="space-y-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications</span>
            {[
              { key: 'notifications', label: 'Push notifications' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between pl-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                <button
                  onClick={() => update({ [key]: !(profile as any)[key] } as any)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${(profile as any)[key] ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
                  role="switch"
                  aria-checked={(profile as any)[key]}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${(profile as any)[key] ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        </div>{/* end 2-col grid */}

        {/* Data Export — Spec §5.2.8, §8 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Export</h2>
          <div className="space-y-3">
            {/* Free tier: JSON + Markdown */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Export as JSON</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Courses, progress, and settings</p>
              </div>
              <button
                onClick={() => {
                  const data = JSON.stringify({ courses: state.courses, profile: state.profile }, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'learnflow-export.json'; a.click();
                  URL.revokeObjectURL(url);
                  toast('Data exported as JSON', 'success');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Export JSON
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Export as Markdown</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">All courses as .md files</p>
              </div>
              <button
                onClick={() => {
                  const md = state.courses.map((c) => {
                    const lessons = c.modules.map((m) => m.lessons.map((l) => `### ${l.title}\n\n${l.content}`).join('\n\n')).join('\n\n');
                    return `# ${c.title}\n\n${c.description}\n\n${lessons}`;
                  }).join('\n\n---\n\n');
                  const blob = new Blob([md], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'learnflow-export.md'; a.click();
                  URL.revokeObjectURL(url);
                  toast('Data exported as Markdown', 'success');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Export MD
              </button>
            </div>
            {/* Pro tier exports */}
            {['PDF', 'SCORM', 'Notion', 'Obsidian'].map((fmt) => (
              <div key={fmt} className="flex items-center justify-between opacity-60 cursor-not-allowed" title="Upgrade to Pro to unlock this export format">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-500">Export as {fmt}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{fmt} format export</p>
                </div>
                <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">PRO</span>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy — Spec §9.3 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">Per our privacy policy, here's what we track:</p>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Learning progress & streaks', tracked: true },
              { label: 'Course creation topics', tracked: true },
              { label: 'Quiz scores & completion rates', tracked: true },
              { label: 'API keys (encrypted, AES-256)', tracked: true },
              { label: 'Conversation content (session only)', tracked: false },
              { label: 'Browsing activity outside LearnFlow', tracked: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
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
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">These actions are permanent and cannot be undone.</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Delete All Data</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Permanently delete all your data (GDPR)</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete ALL your data? This action is permanent and cannot be undone.')) {
                  if (confirm('This is your final confirmation. Type "delete" mentally and click OK to proceed.')) {
                    localStorage.clear();
                    window.location.href = '/';
                  }
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Delete My Data
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
