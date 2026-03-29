import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePipeline, type PipelineArtifactsIndex } from '../hooks/usePipeline.js';
import { apiGet } from '../context/AppContext.js';
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
  const [artifacts, setArtifacts] = useState<PipelineArtifactsIndex | null>(null);
  const [artifactsError, setArtifactsError] = useState<string | null>(null);

  // Artifacts index (server file system paths / logs) for debugging + provenance.
  // NOTE: must be before early returns to preserve hook order.
  useEffect(() => {
    if (!state?.id) return;

    let cancelled = false;

    const fetchArtifacts = async () => {
      try {
        setArtifactsError(null);
        const data = (await apiGet(`/pipeline/${state.id}/artifacts`)) as PipelineArtifactsIndex;
        if (!cancelled) setArtifacts(data);
      } catch {
        if (!cancelled) setArtifactsError('Unable to load artifacts index');
      }
    };

    void fetchArtifacts();
    const interval = window.setInterval(fetchArtifacts, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [state?.id]);

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
    <section
      className="min-h-screen bg-bg dark:bg-bg-dark"
      aria-label="Pipeline Detail"
      data-screen="pipeline-detail"
    >
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
                    toast(
                      state.status === 'FAILED' || state.stage === 'failed'
                        ? 'Retry queued'
                        : 'Pipeline restarted',
                      'success',
                    );
                    if (data?.pipelineId) nav(`/pipeline/${data.pipelineId}`);
                  } catch {
                    toast('Restart failed', 'error');
                  }
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <IconRefresh size={16} className="text-white" decorative />
                  {state.status === 'FAILED' || state.stage === 'failed'
                    ? state.failReason === 'stalled'
                      ? 'Resume Build'
                      : 'Retry Build'
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

          {/* Status + last error */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-200">Status:</span>{' '}
              {state.status} · <span className="font-semibold">Stage:</span> {state.stage}
              {typeof (state as any).retryCount === 'number'
                ? ` · Retries: ${(state as any).retryCount}`
                : ''}
            </div>
            {((state as any).lastError || state.error) && (
              <div className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
                <span className="font-semibold">Last error:</span>{' '}
                {String((state as any).lastError || state.error)}
              </div>
            )}
          </div>
        </div>

        {/* Artifacts */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Artifacts
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Build artifacts are saved under <span className="font-mono">course-artifacts</span>{' '}
                on the server.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                try {
                  const data = (await apiGet(
                    `/pipeline/${state.id}/artifacts`,
                  )) as PipelineArtifactsIndex;
                  await navigator.clipboard.writeText(String(data?.artifactsRoot || ''));
                  toast('Artifacts path copied', 'success');
                } catch {
                  toast('Copy failed', 'error');
                }
              }}
            >
              Copy path
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
              <span className="font-semibold">Root:</span>{' '}
              <span className="font-mono break-all">{artifacts?.artifactsRoot || 'Loading…'}</span>
              {artifacts?.artifactsRootHint ? (
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Repo hint: <span className="font-mono">{artifacts.artifactsRootHint}</span>
                </div>
              ) : null}
              {artifactsError ? (
                <div className="text-[11px] text-red-700 dark:text-red-300 mt-1">
                  {artifactsError}
                </div>
              ) : null}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Quick links
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  artifacts?.known || [
                    {
                      rel: 'course-research.md',
                      exists: false,
                      isFile: true,
                      isDir: false,
                      size: 0,
                    },
                    {
                      rel: 'lessonplan.md',
                      exists: false,
                      isFile: true,
                      isDir: false,
                      size: 0,
                    },
                    {
                      rel: 'research/course/sources.json',
                      exists: false,
                      isFile: true,
                      isDir: false,
                      size: 0,
                    },
                    {
                      rel: 'research/course/images.json',
                      exists: false,
                      isFile: true,
                      isDir: false,
                      size: 0,
                    },
                    {
                      rel: 'research/course/extracted',
                      exists: false,
                      isFile: false,
                      isDir: true,
                      size: 0,
                    },
                    { rel: 'research/lessons', exists: false, isFile: false, isDir: true, size: 0 },
                    { rel: 'logs/openai', exists: false, isFile: false, isDir: true, size: 0 },
                  ]
                ).map((k) => {
                  const isJson = k.rel.endsWith('.json');
                  const href = isJson
                    ? `/api/v1/pipeline/${state.id}/artifacts/file?path=${encodeURIComponent(k.rel)}`
                    : null;

                  return (
                    <div
                      key={k.rel}
                      className={
                        'rounded-xl border p-3 text-xs flex items-start justify-between gap-3 ' +
                        (k.exists
                          ? 'border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10'
                          : 'border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/20')
                      }
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-gray-800 dark:text-gray-100 break-all">
                          {k.rel}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          {k.exists ? 'Present' : 'Not found yet'}
                          {k.exists && typeof k.size === 'number' && k.isFile
                            ? ` · ${k.size} bytes`
                            : ''}
                        </p>
                      </div>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-accent font-semibold hover:underline"
                          title="Open JSON"
                        >
                          Open
                        </a>
                      ) : (
                        <button
                          className="shrink-0 text-gray-500 dark:text-gray-400 font-semibold"
                          onClick={() => {
                            navigator.clipboard
                              .writeText(`${artifacts?.artifactsRoot || ''}/${k.rel}`)
                              .then(() => toast('Path copied', 'success'))
                              .catch(() => toast('Copy failed', 'error'));
                          }}
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OpenAI log artifacts */}
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
                OpenAI logs (request/response)
              </p>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 p-3">
                {artifacts?.openaiLogs && artifacts.openaiLogs.length > 0 ? (
                  <div className="space-y-1">
                    {artifacts.openaiLogs.slice(-12).map((rel) => (
                      <div key={rel} className="flex items-center justify-between gap-3">
                        <a
                          href={`/api/v1/pipeline/${state.id}/artifacts/file?path=${encodeURIComponent(rel)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] text-accent hover:underline break-all"
                        >
                          {rel}
                        </a>
                        <button
                          className="text-[11px] text-gray-600 dark:text-gray-300 font-semibold"
                          onClick={() => {
                            navigator.clipboard
                              .writeText(`${artifacts?.artifactsRoot || ''}/${rel}`)
                              .then(() => toast('File path copied', 'success'))
                              .catch(() => toast('Copy failed', 'error'));
                          }}
                        >
                          Copy path
                        </button>
                      </div>
                    ))}
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                      Hint: pipeline logs will also include{' '}
                      <span className="font-mono">[openai.artifacts] request=… response=…</span>.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    No OpenAI log artifacts found yet.
                  </p>
                )}
              </div>
            </div>
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
              {(state.logs || []).map((l: any, i: number) => {
                const msg = String(l.message || '');
                const artifactMatch = msg.match(
                  /\[openai\.artifacts\]\s+request=([^\s]+)\s+response=([^\s]+)/,
                );
                const reqAbs = artifactMatch?.[1];
                const respAbs = artifactMatch?.[2];

                // Convert absolute file paths to relative paths within artifacts root, if we can.
                const makeRel = (abs?: string) => {
                  if (!abs || !artifacts?.artifactsRoot) return null;
                  if (!abs.startsWith(artifacts.artifactsRoot)) return null;
                  const rel = abs.slice(artifacts.artifactsRoot.length).replace(/^\/+/, '');
                  return rel || null;
                };

                const reqRel = makeRel(reqAbs);
                const respRel = makeRel(respAbs);

                return (
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
                      {msg}
                      {reqRel && respRel ? (
                        <span className="ml-2 text-[11px] text-gray-300">
                          (
                          <a
                            href={`/api/v1/pipeline/${state.id}/artifacts/file?path=${encodeURIComponent(reqRel)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent hover:underline"
                          >
                            request
                          </a>
                          {' / '}
                          <a
                            href={`/api/v1/pipeline/${state.id}/artifacts/file?path=${encodeURIComponent(respRel)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent hover:underline"
                          >
                            response
                          </a>
                          )
                        </span>
                      ) : null}
                    </span>
                  </div>
                );
              })}
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
