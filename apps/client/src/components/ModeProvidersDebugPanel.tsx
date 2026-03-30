import React, { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../context/AppContext.js';

function getRuntimeEnv(): Record<string, string | undefined> | null {
  const v = (globalThis as any)?.__LEARNFLOW_ENV__;
  if (v && typeof v === 'object') return v as any;
  return null;
}

function boolLabel(v: boolean): string {
  return v ? 'true' : 'false';
}

type Diagnostic = {
  billingMode: 'mock' | 'real' | 'unknown';
  sourceMode: 'mock' | 'real' | 'unknown';
  requiredResearchProvider: string;
  activeKeyProviders: string[];
};

/**
 * Dev-only panel: shows runtime mode/provider truth without revealing secrets.
 * IMPORTANT: compiled out in prod.
 */
export function ModeProvidersDebugPanel() {
  // Gate hard: Vite compile-time dev flag. This should tree-shake out in prod.
  if (!import.meta.env.DEV) return null;

  const runtimeEnv = getRuntimeEnv();
  const devAuthBypass = runtimeEnv?.VITE_DEV_AUTH_BYPASS === '1';

  const [diag, setDiag] = useState<Diagnostic | null>(null);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setErr('');
        const d = (await apiGet('/diagnostics/mode')) as any;
        if (!cancelled) {
          setDiag({
            billingMode: (d?.billingMode as any) || 'unknown',
            sourceMode: (d?.sourceMode as any) || 'unknown',
            requiredResearchProvider: String(d?.requiredResearchProvider || 'openai_web_search'),
            activeKeyProviders: Array.isArray(d?.activeKeyProviders)
              ? d.activeKeyProviders.map(String)
              : [],
          });
        }
      } catch (e: any) {
        if (!cancelled) {
          setDiag(null);
          setErr(String(e?.message || 'Failed to load diagnostics'));
        }
      }
    };

    void load();

    // Avoid background polling in unit tests (Vitest runs concurrent jsdom tests;
    // intervals can leak work into other tests and create flake).
    const isVitest = typeof process !== 'undefined' && !!(process as any).env?.VITEST;
    if (isVitest) return () => void (cancelled = true);

    const id = window.setInterval(load, 7000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const row = useMemo(() => {
    const userId = (() => {
      try {
        const u = JSON.parse(localStorage.getItem('learnflow-user') || 'null');
        return u?.id ? String(u.id) : null;
      } catch {
        return null;
      }
    })();

    return { userId };
  }, []);

  return (
    <section
      aria-label="Mode & Providers"
      className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Dev: Mode & Providers
        </h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
          dev-only
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/20 p-3">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">Auth</div>
          <div className="mt-1 text-xs text-gray-800 dark:text-gray-200">
            devAuthBypass=<span className="font-mono">{boolLabel(devAuthBypass)}</span>
          </div>
          <div className="mt-1 text-xs font-mono text-gray-800 dark:text-gray-200 break-all">
            userId={row.userId || 'unknown'}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/20 p-3">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">Providers</div>
          <div className="mt-1 text-xs text-gray-800 dark:text-gray-200">
            research=<span className="font-mono">{diag?.requiredResearchProvider || '…'}</span>
          </div>
          <div className="mt-1 text-xs text-gray-800 dark:text-gray-200">
            activeKeys=
            <span className="font-mono">
              {(diag?.activeKeyProviders || []).length > 0
                ? (diag?.activeKeyProviders || []).join(', ')
                : 'none'}
            </span>
          </div>
        </div>

        <div className="sm:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/20 p-3">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">Modes</div>
          <div className="mt-1 text-xs font-mono text-gray-800 dark:text-gray-200 flex flex-wrap gap-2">
            <span>billingMode={diag?.billingMode || 'unknown'}</span>
            <span>sourceMode={diag?.sourceMode || 'unknown'}</span>
          </div>
          {err ? <div className="mt-2 text-xs text-red-700 dark:text-red-300">{err}</div> : null}
          <p className="mt-2 text-[11px] text-gray-600 dark:text-gray-400">
            Shows best-effort runtime truth. Never reveals keys.
          </p>
        </div>
      </div>
    </section>
  );
}
