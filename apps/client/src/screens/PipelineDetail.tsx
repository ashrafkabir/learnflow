import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePipeline } from '../hooks/usePipeline.js';
import { apiPost } from '../context/AppContext.js';
import { PipelineView } from '../components/pipeline/PipelineView.js';
import { Button } from '../components/Button.js';
import { useToast } from '../components/Toast.js';
import {
  IconCheck,
  IconClipboard,
  IconPackage,
  IconRefresh,
  IconThread,
  IconBook,
} from '../components/icons/index.js';

export function PipelineDetail() {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const nav = useNavigate();
  const { state } = usePipeline(pipelineId || null);
  const { toast } = useToast();
  const [showLogs, setShowLogs] = useState(false);

  if (!state) {
    return (
      <section className="min-h-screen bg-bg dark:bg-bg-dark">
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
            <Button variant="ghost" onClick={() => nav('/dashboard')}>
              ← Back
            </Button>
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-6 w-48" />
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl h-16" />
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full h-2" />
          <div className="flex gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl h-40 w-48 flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Derive stats from pipeline state using actual PipelineState properties
  const crawlThreads = state.crawlThreads || [];
  const totalThreads = crawlThreads.length;
  const activeThreads = crawlThreads.filter(
    (t: any) => t.status === 'running' || t.status === 'active',
  ).length;
  const _completedThreads = crawlThreads.filter(
    (t: any) => t.status === 'complete' || t.status === 'done',
  ).length;
  const _failedThreads = crawlThreads.filter(
    (t: any) => t.status === 'error' || t.status === 'failed',
  ).length;
  const progressPct = Math.round(state.progress ?? 0);

  const statusBadge =
    state.stage === 'published'
      ? {
          label: 'Complete',
          cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        }
      : state.error
        ? { label: 'Error', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
        : state.stage === 'reviewing'
          ? {
              label: 'Paused',
              cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            }
          : {
              label: 'Running',
              cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            };

  const createdAt = state.startedAt ? new Date(state.startedAt).toLocaleString() : 'N/A';
  const updatedAt = state.updatedAt ? new Date(state.updatedAt).toLocaleString() : 'N/A';

  const milestoneOrder = ['plan_ready', 'sources_ready', 'draft_ready', 'quality_passed'] as const;
  const milestoneLabels: Record<(typeof milestoneOrder)[number], string> = {
    plan_ready: 'Plan',
    sources_ready: 'Sources',
    draft_ready: 'Draft',
    quality_passed: 'Quality',
  };

  const milestonesByLesson = (() => {
    const ms = Array.isArray((state as any).lessonMilestones)
      ? ((state as any).lessonMilestones as any[])
      : [];
    const by = new Map<string, { lessonId: string; lessonTitle: string; types: Set<string> }>();
    for (const m of ms) {
      const lid = String(m?.lessonId || '');
      if (!lid) continue;
      const title = String(m?.lessonTitle || lid);
      const entry = by.get(lid) || { lessonId: lid, lessonTitle: title, types: new Set() };
      if (title && !entry.lessonTitle) entry.lessonTitle = title;
      if (m?.type) entry.types.add(String(m.type));
      by.set(lid, entry);
    }
    return Array.from(by.values());
  })();

  return (
    <section className="min-h-screen bg-bg dark:bg-bg-dark" aria-label="Pipeline Detail">
      {/* Breadcrumb Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2"
            aria-label="Breadcrumb"
          >
            <button
              onClick={() => nav('/dashboard')}
              className="hover:text-accent transition-colors"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">Pipeline</span>
          </nav>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => nav('/dashboard')}>
                ←
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {state.topic || 'Course Pipeline'}
                  </h1>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusBadge.cls}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Created {createdAt} · Updated {updatedAt}
                </p>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowLogs(!showLogs)}>
                <span className="inline-flex items-center gap-2">
                  <IconClipboard
                    size={16}
                    className="text-gray-700 dark:text-gray-200"
                    decorative
                  />
                  {showLogs ? 'Hide Logs' : 'View Logs'}
                </span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast('Pipeline paused', 'success')}
                disabled={state.stage === 'published' || state.stage === 'reviewing'}
              >
                Pause
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  try {
                    const data = await apiPost(`/pipeline/${state.id}/restart`, {});
                    toast('Pipeline restarted', 'success');
                    if (data?.pipelineId) nav(`/pipeline/${data.pipelineId}`);
                  } catch {
                    toast('Restart failed', 'error');
                  }
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <IconRefresh size={16} className="text-white" decorative />
                  {state.status === 'FAILED' && state.failReason === 'stalled'
                    ? 'Resume Build'
                    : 'Restart Pipeline'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Stage', value: state.stage || 'idle', Icon: IconPackage },
            { label: 'Sources', value: state.organizedSources ?? 0, Icon: IconCheck },
            {
              label: 'Active Threads',
              value: `${activeThreads}/${totalThreads}`,
              Icon: IconThread,
            },
            {
              label: 'Modules / Lessons',
              value: `${state.moduleCount ?? 0} / ${state.lessonCount ?? 0}`,
              Icon: IconBook,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-4 text-center"
            >
              <stat.Icon size={22} className="text-accent mx-auto" decorative />
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Progress
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{progressPct}%</span>
          </div>
          <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Pipeline Visualization */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pipeline Stages
          </h2>
          <PipelineView state={state} onViewCourse={(courseId) => nav(`/courses/${courseId}`)} />
        </div>

        {/* Iter75 P0: Lesson Milestones */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Milestones</h2>
          {milestonesByLesson.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Milestones will appear as lessons move through planning, sources, drafting, and
              quality checks.
            </p>
          ) : (
            <div className="space-y-4">
              {milestonesByLesson.map((l) => (
                <div
                  key={l.lessonId}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {l.lessonTitle || l.lessonId}
                  </p>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {milestoneOrder.map((t) => {
                      const done = l.types.has(t);
                      return (
                        <div
                          key={t}
                          className={
                            'flex items-center gap-2 rounded-xl px-3 py-2 text-xs border ' +
                            (done
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300')
                          }
                          aria-label={
                            (l.lessonTitle || l.lessonId) +
                            ' ' +
                            t +
                            ' ' +
                            (done ? 'done' : 'pending')
                          }
                        >
                          <span
                            className={
                              'inline-flex items-center justify-center w-5 h-5 rounded-full ' +
                              (done
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200')
                            }
                            aria-hidden="true"
                          >
                            {done ? '✓' : '•'}
                          </span>
                          <span className="font-semibold">{milestoneLabels[t]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Logs Panel */}
        {showLogs && (
          <div className="bg-gray-950 rounded-2xl border border-gray-800 shadow-card p-6">
            <h2 className="text-lg font-semibold text-green-400 mb-3 font-mono inline-flex items-center gap-2">
              <IconClipboard size={18} className="text-green-400" decorative />
              Pipeline Logs
            </h2>
            <div className="font-mono text-xs text-green-300 space-y-1 max-h-64 overflow-y-auto">
              {(state.logs || []).map((l: any, i: number) => (
                <div key={i} className="flex gap-2">
                  <span className="text-gray-500">
                    [{String(l.ts || '').slice(11, 19) || new Date().toISOString().slice(11, 19)}]
                  </span>
                  <span
                    className={
                      l.level === 'error'
                        ? 'text-red-400'
                        : l.level === 'warn'
                          ? 'text-yellow-300'
                          : 'text-green-300'
                    }
                  >
                    {l.message}
                  </span>
                </div>
              ))}
              {(state.logs || []).length === 0 && (
                <div className="text-gray-500">No log entries yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
