import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.js';

export function ProfileSettings() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();
  const { profile } = state;

  const update = (partial: Partial<typeof profile>) => {
    dispatch({ type: 'UPDATE_PROFILE', profile: partial });
  };

  const toggleDarkMode = () => {
    const next = !profile.darkMode;
    update({ darkMode: next });
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('learnflow-dark', String(next));
  };

  return (
    <section
      aria-label="Profile Settings"
      data-screen="settings"
      className="min-h-screen bg-gray-50 dark:bg-bg-dark"
    >
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => nav('/dashboard')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Subscription Tier (Task 14) */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Current Plan</p>
              <p className="text-2xl font-bold">Free</p>
              <p className="text-sm opacity-75 mt-1">
                3 courses · Basic agents · Bring your own keys
              </p>
            </div>
            <button className="bg-white text-purple-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors shadow-sm">
              Upgrade to Pro
            </button>
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
                  <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-medium">
                    PRO
                  </span>
                ) : (
                  <span className="text-xs text-success font-medium">✓ Free</span>
                )}
              </div>
            ))}
          </div>
        </div>

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
        </div>

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
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Notifications</span>
            <button
              onClick={() => update({ notifications: !profile.notifications })}
              className={`relative w-11 h-6 rounded-full transition-colors ${profile.notifications ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
              role="switch"
              aria-checked={profile.notifications}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${profile.notifications ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
