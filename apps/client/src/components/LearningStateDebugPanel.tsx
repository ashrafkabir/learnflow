import React, { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../context/AppContext.js';

function getRuntimeEnv(): Record<string, string | undefined> | null {
  const v = (globalThis as any)?.__LEARNFLOW_ENV__;
  if (v && typeof v === 'object') return v as any;
  return null;
}

type LearningDiag = {
  userId: string;
  today: {
    limit: number;
    reasonCounts: Record<string, number>;
  };
  mastery: {
    counts: { new: number; learning: number; solid: number; mastered: number };
    soonestNextReviews: Array<{ courseId: string; lessonId: string; nextReviewAt: string | null }>;
  };
};

/**
 * Dev-only diagnostics panel for adaptive learning loop.
 * Shows counts + soonest nextReviewAt. Never reveals secrets.
 */
export function LearningStateDebugPanel() {
  if (!import.meta.env.DEV) return null;

  const runtimeEnv = getRuntimeEnv();
  const devAuthBypass = runtimeEnv?.VITE_DEV_AUTH_BYPASS === '1';

  const [diag, setDiag] = useState<LearningDiag | null>(null);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setErr('');
        const d = (await apiGet('/diagnostics/learning')) as any;
        if (!cancelled) {
          setDiag(d as LearningDiag);
        }
      } catch (e: any) {
        if (!cancelled) {
          setDiag(null);
          setErr(String(e?.message || 'Failed to load learning diagnostics'));
        }
      }
    };

    void load();

    const isVitest = typeof process !== 'undefined' && !!(process as any).env?.VITEST;
    if (isVitest) return () => void (cancelled = true);

    const id = window.setInterval(load, 7000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const rows = useMemo(() => {
    const userId = (() => {
      try {
        const u = JSON.parse(localStorage.getItem('learnflow-user') || 'null');
        return u?.id ? String(u.id) : null;
      } catch {
        return null;
      }
    })();

    const reasonCounts = diag?.today?.reasonCounts || {};
    const masteryCounts = diag?.mastery?.counts;
    const soonest = Array.isArray(diag?.mastery?.soonestNextReviews)
      ? diag!.mastery!.soonestNextReviews
      : [];

    return { userId, reasonCounts, masteryCounts, soonest };
  }, [diag]);

  return (
    <section
      aria-label="Learning State"
      className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Dev: Learning State</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
          dev-only
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/20 p-3">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">Auth</div>
          <div className="mt-1 text-xs text-gray-800 dark:text-gray-200">
            devAuthBypass=<span className="font-mono">{devAuthBypass ? 'true' : 'false'}</span>
          </div>
          <div className="mt-1 text-xs font-mono text-gray-800 dark:text-gray-200 break-all">
            userId={rows.userId || 'unknown'}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/20 p-3">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">Today's Lessons</div>
          <div className="mt-1 text-xs font-mono text-gray-800 dark:text-gray-200 flex flex-wrap gap-2">
            {Object.keys(rows.reasonCounts).length > 0 ? (
              Object.entries(rows.reasonCounts).map(([k, v]) => (
                <span key={k}>
                  {k}={v}
                </span>
              ))
            ) : (
              <span>…</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/20 p-3">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">Mastery summary</div>
          <div className="mt-1 text-xs font-mono text-gray-800 dark:text-gray-200 flex flex-wrap gap-2">
            {rows.masteryCounts ? (
              <>
                <span>new={rows.masteryCounts.new}</span>
                <span>learning={rows.masteryCounts.learning}</span>
                <span>solid={rows.masteryCounts.solid}</span>
                <span>mastered={rows.masteryCounts.mastered}</span>
              </>
            ) : (
              <span>…</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-black/20 p-3">
          <div className="text-[11px] text-gray-500 dark:text-gray-400">Soonest nextReviewAt</div>
          <div className="mt-1 text-xs text-gray-800 dark:text-gray-200 space-y-1">
            {rows.soonest.length > 0 ? (
              rows.soonest.map((r, idx) => (
                <div key={`${r.courseId}:${r.lessonId}:${idx}`} className="text-[11px]">
                  <span className="font-mono">{r.nextReviewAt || 'null'}</span>
                  <span className="text-gray-500 dark:text-gray-400"> · </span>
                  <span className="font-mono">
                    {r.courseId}:{r.lessonId}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-gray-500 dark:text-gray-400">none</div>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          {err ? <div className="mt-1 text-xs text-red-700 dark:text-red-300">{err}</div> : null}
          <p className="mt-2 text-[11px] text-gray-600 dark:text-gray-400">
            Shows best-effort learning loop diagnostics. Never reveals keys.
          </p>
        </div>
      </div>
    </section>
  );
}
