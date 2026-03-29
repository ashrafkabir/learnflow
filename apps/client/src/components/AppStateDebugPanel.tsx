import React from 'react';
import { useApp } from '../context/AppContext.js';

function getRuntimeEnv(): Record<string, string | undefined> | null {
  const v = (globalThis as any)?.__LEARNFLOW_ENV__;
  if (v && typeof v === 'object') return v as any;
  return null;
}

function boolLabel(v: boolean): string {
  return v ? 'true' : 'false';
}

/**
 * Dev-only panel for quickly inspecting client app state.
 * IMPORTANT: Do not render this in production builds.
 */
export function AppStateDebugPanel() {
  const { state } = useApp();

  const runtimeEnv = getRuntimeEnv();
  const devAuthBypass = runtimeEnv?.VITE_DEV_AUTH_BYPASS === '1';

  // Gate hard: Vite compile-time dev flag. This should tree-shake out in prod.
  if (!import.meta.env.DEV) return null;

  const userId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('learnflow-user') || 'null');
      return u?.id ? String(u.id) : null;
    } catch {
      return null;
    }
  })();

  const tier = state.subscription;
  const courseCount = Array.isArray(state.courses) ? state.courses.length : 0;
  const activeCourseId = state.activeCourse?.id || null;

  const featureFlags = {
    devAuthBypass,
    // capability-style flags (server-driven)
    updateAgent: Boolean(state.capabilities?.update_agent),
    advancedAnalytics: Boolean(state.capabilities?.['analytics.advanced']),
  };

  return (
    <section
      aria-label="App State Debug"
      className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Dev: App State Debug
        </h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
          dev-only
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/20 p-3">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">User</div>
          <div className="mt-1 text-xs font-mono text-gray-800 dark:text-gray-200 break-all">
            id={userId || 'unknown'}
          </div>
          <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">tier={tier}</div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/20 p-3">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">Courses</div>
          <div className="mt-1 text-xs text-gray-800 dark:text-gray-200">
            count=<span className="font-mono">{courseCount}</span>
          </div>
          <div className="mt-1 text-xs text-gray-800 dark:text-gray-200">
            activeCourseId=<span className="font-mono">{activeCourseId || 'none'}</span>
          </div>
        </div>

        <div className="sm:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/20 p-3">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">Feature flags</div>
          <div className="mt-1 text-xs font-mono text-gray-800 dark:text-gray-200 flex flex-wrap gap-2">
            <span>devAuthBypass={boolLabel(featureFlags.devAuthBypass)}</span>
            <span>updateAgent={boolLabel(featureFlags.updateAgent)}</span>
            <span>advancedAnalytics={boolLabel(featureFlags.advancedAnalytics)}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-gray-600 dark:text-gray-400">
        This panel is compiled out in production builds.
      </p>
    </section>
  );
}
