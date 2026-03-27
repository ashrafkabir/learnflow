import React from 'react';
import { Button } from '../Button.js';
import { apiGet, apiPost, apiDelete, useApp } from '../../context/AppContext.js';
import { useToast } from '../Toast.js';

type TopicRow = {
  id: string;
  topic: string;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string | null;

  // Update Agent trust-loop run state (best-effort)
  lockedAt?: string | null;
  lockId?: string;
  lastRunAt?: string | null;
  lastRunOk?: boolean;
  lastRunError?: string;
};

type RunRow = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  topicsChecked: number;
  sourcesChecked: number;
  notificationsCreated: number;
  failuresJson?: string;
};

type SourceRow = {
  id: string;
  topicId: string;
  url: string;
  enabled?: boolean;
  position?: number;
  sourceType?: string;
  createdAt?: string;
  lastCheckedAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: string;
  lastErrorAt?: string | null;
  nextEligibleAt?: string | null;
  failureCount?: number;
  lastItemUrlSeen?: string;
  lastItemPublishedAt?: string | null;
};

function fmt(ts?: string | null) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export function UpdateAgentSettingsPanel() {
  const { state } = useApp();
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(false);
  const [topics, setTopics] = React.useState<TopicRow[]>([]);
  const [selectedTopicId, setSelectedTopicId] = React.useState<string>('');
  const [sources, setSources] = React.useState<SourceRow[]>([]);
  const [runs, setRuns] = React.useState<RunRow[]>([]);

  const [newTopic, setNewTopic] = React.useState('');
  const [newSourceUrl, setNewSourceUrl] = React.useState('');

  const loadTopics = React.useCallback(async () => {
    const res = await apiGet('/update-agent/topics');
    const rows = Array.isArray(res?.topics) ? res.topics : [];
    setTopics(rows);
    if (!selectedTopicId && rows[0]?.id) setSelectedTopicId(rows[0].id);
  }, [selectedTopicId]);

  const loadRuns = React.useCallback(async () => {
    const res = await apiGet('/update-agent/runs?limit=5');
    const rows = Array.isArray(res?.runs) ? res.runs : [];
    setRuns(rows);
  }, []);

  const loadSources = React.useCallback(async (topicId: string) => {
    if (!topicId) {
      setSources([]);
      return;
    }
    const res = await apiGet(`/update-agent/sources?topicId=${encodeURIComponent(topicId)}`);
    const rows = Array.isArray(res?.sources) ? res.sources : [];
    setSources(rows);
  }, []);

  React.useEffect(() => {
    setLoading(true);
    Promise.all([loadTopics(), loadRuns()])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadTopics]);

  React.useEffect(() => {
    loadSources(selectedTopicId).catch(() => {});
  }, [selectedTopicId, loadSources]);

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  const topicStatus = React.useMemo(() => {
    if (!selectedTopic) {
      return {
        lastRunAt: null as string | null,
        lastRunOk: true,
        lastRunError: '',
        lockedAt: null as string | null,
        nextEligibleAt: null as string | null,
        failureCount: 0,
        lastError: '',
      };
    }

    const nextEligibleAt = sources
      .map((s) => (s.nextEligibleAt ? new Date(String(s.nextEligibleAt)).getTime() : NaN))
      .filter((t) => Number.isFinite(t))
      .sort((a, b) => a - b)[0];

    const failureCount = sources.reduce(
      (acc, s) => acc + (Number.isFinite(s.failureCount) ? Number(s.failureCount) : 0),
      0,
    );

    const lastError =
      sources
        .filter((s) => Boolean(s.lastError))
        .sort((a, b) => {
          const ta = a.lastErrorAt ? new Date(String(a.lastErrorAt)).getTime() : 0;
          const tb = b.lastErrorAt ? new Date(String(b.lastErrorAt)).getTime() : 0;
          return tb - ta;
        })[0]?.lastError || '';

    return {
      lastRunAt: selectedTopic.lastRunAt ?? null,
      lastRunOk: selectedTopic.lastRunOk !== false,
      lastRunError: selectedTopic.lastRunError || '',
      lockedAt: selectedTopic.lockedAt ?? null,
      nextEligibleAt: Number.isFinite(nextEligibleAt)
        ? new Date(nextEligibleAt).toISOString()
        : null,
      failureCount,
      lastError,
    };
  }, [selectedTopic, sources]);

  if (state.subscription !== 'pro') {
    return (
      <section
        aria-label="Update Agent"
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-3"
      >
        <header>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Update Agent</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Update Agent is a <span className="font-semibold">Pro</span> feature.
          </p>
        </header>
        <p className="text-xs text-gray-700 dark:text-gray-200">
          In this MVP, the Update Agent monitors <span className="font-semibold">RSS/Atom</span>{' '}
          sources you add and creates a notification feed. It does not crawl the open web, and runs
          are <span className="font-semibold">best-effort</span>.
        </p>
        <div className="flex items-center gap-2">
          <a href="/pricing" className="inline-flex">
            <Button variant="secondary" size="sm">
              Upgrade to Pro
            </Button>
          </a>
          <a href="/docs/update-agent-scheduling" className="text-xs text-accent hover:underline">
            Scheduling docs
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Update Agent"
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-4"
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Update Agent</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Monitor topics via RSS/Atom sources and receive a notification feed.
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            This is an MVP trust-loop: best-effort checks with backoff + locks. It may miss updates.
            Backoff increases the delay after failures, and locks prevent overlapping runs.
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            Important: it does <span className="font-semibold">not</span> crawl the open web or
            follow sites automatically — it only checks the sources you add here.
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            Scheduling is external in this MVP (cron/systemd/K8s).{' '}
            <a
              href="/docs/update-agent-scheduling"
              className="text-accent hover:underline font-semibold"
            >
              See scheduling guidance
            </a>
            . Use <span className="font-semibold">Run now</span> to trigger a one-off check.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            setLoading(true);
            try {
              await loadTopics();
              await loadSources(selectedTopicId);
              await loadRuns();
              toast('Update Agent settings refreshed', 'success');
            } catch {
              toast('Failed to refresh Update Agent settings', 'error');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
        >
          Refresh
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trust loop summary */}
        <div className="md:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                Topic status
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-200 mt-1">
                Selected: <span className="font-semibold">{selectedTopic?.topic || '—'}</span>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="text-xs text-gray-700 dark:text-gray-200">
                  <span className="text-gray-600 dark:text-gray-300">Last run:</span>{' '}
                  <span className="font-semibold">{fmt(topicStatus.lastRunAt)}</span>
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-200">
                  <span className="text-gray-600 dark:text-gray-300">Last run status:</span>{' '}
                  <span
                    className={
                      topicStatus.lastRunOk
                        ? 'font-semibold text-green-700 dark:text-green-300'
                        : 'font-semibold text-red-700 dark:text-red-300'
                    }
                  >
                    {topicStatus.lastRunOk ? 'Success' : 'Failure'}
                  </span>
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-200">
                  <span className="text-gray-600 dark:text-gray-300">Next eligible:</span>{' '}
                  <span className="font-semibold">{fmt(topicStatus.nextEligibleAt)}</span>
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-200">
                  <span className="text-gray-600 dark:text-gray-300">Failures (sources):</span>{' '}
                  <span className="font-semibold">{topicStatus.failureCount}</span>
                </div>
              </div>
              {topicStatus.lockedAt ? (
                <div className="text-xs text-gray-700 dark:text-gray-200 mt-2">
                  <span className="text-gray-600 dark:text-gray-300">Run lock:</span>{' '}
                  <span className="font-semibold">In progress</span> (locked{' '}
                  {fmt(topicStatus.lockedAt)})
                </div>
              ) : null}
              {topicStatus.lastRunError ? (
                <div className="text-xs text-red-700 dark:text-red-300 mt-2">
                  Last run error: {topicStatus.lastRunError}
                </div>
              ) : null}
              {!topicStatus.lastRunError && topicStatus.lastError ? (
                <div className="text-xs text-red-700 dark:text-red-300 mt-2">
                  Last source error: {topicStatus.lastError}
                </div>
              ) : null}

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                  Recent runs
                </div>
                {runs.length === 0 ? (
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">—</div>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {runs.slice(0, 5).map((r) => (
                      <li key={r.id} className="text-xs text-gray-700 dark:text-gray-200">
                        <span className="font-semibold">{fmt(r.startedAt)}</span> —{' '}
                        <span
                          className={
                            r.status === 'success'
                              ? 'font-semibold text-green-700 dark:text-green-300'
                              : r.status === 'running'
                                ? 'font-semibold text-yellow-700 dark:text-yellow-300'
                                : 'font-semibold text-red-700 dark:text-red-300'
                          }
                        >
                          {r.status}
                        </span>{' '}
                        · {r.notificationsCreated} new · {r.sourcesChecked} sources
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Button
                size="sm"
                disabled={!selectedTopic?.topic || loading}
                onClick={async () => {
                  // Canonical "tick" endpoint (runs all enabled topics/sources).
                  setLoading(true);
                  try {
                    await apiPost('/update-agent/tick', {});
                    await loadTopics();
                    await loadSources(selectedTopicId);
                    await loadRuns();
                    toast('Update Agent run started', 'success');
                  } catch (e: any) {
                    toast(String(e?.message || 'Failed to run Update Agent'), 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Run now
              </Button>
              <div className="text-[11px] text-gray-600 dark:text-gray-300 text-right max-w-[220px]">
                Tip: “Run already in progress” means a lock is active (prevents overlapping runs).
              </div>
            </div>
          </div>
        </div>
        {/* Topics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Topics</h3>
          </div>

          <div className="flex gap-2">
            <input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Add a monitored topic (e.g., AI Safety)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <Button
              size="sm"
              onClick={async () => {
                const t = newTopic.trim();
                if (!t) return;
                try {
                  await apiPost('/update-agent/topics', { topic: t, enabled: true });
                  setNewTopic('');
                  await loadTopics();
                  toast('Topic added', 'success');
                } catch (e: any) {
                  toast(String(e?.message || 'Failed to add topic'), 'error');
                }
              }}
            >
              Add
            </Button>
          </div>

          <ul role="list" className="space-y-2">
            {topics.map((t) => {
              const active = t.id === selectedTopicId;
              const enabled = t.enabled !== false;
              return (
                <li
                  key={t.id}
                  role="listitem"
                  className={`p-3 rounded-xl border ${active ? 'border-accent bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      className="text-left flex-1"
                      onClick={() => setSelectedTopicId(t.id)}
                      aria-label={`Select topic ${t.topic}`}
                    >
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t.topic}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {enabled ? 'Enabled' : 'Disabled'} · Created {fmt(t.createdAt)}
                      </div>
                    </button>

                    <div className="flex flex-col items-end gap-2">
                      <label className="text-xs text-gray-700 dark:text-gray-200 inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={async (e) => {
                            try {
                              await apiPost('/update-agent/topics/update', {
                                id: t.id,
                                enabled: e.target.checked,
                              });
                              await loadTopics();
                              toast('Topic updated', 'success');
                            } catch (err: any) {
                              toast(String(err?.message || 'Failed to update topic'), 'error');
                            }
                          }}
                        />
                        Enabled
                      </label>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={async () => {
                          if (
                            !confirm(`Delete topic "${t.topic}"? This will delete its sources.`)
                          ) {
                            return;
                          }
                          try {
                            await apiDelete(`/update-agent/topics/${t.id}`);
                            if (selectedTopicId === t.id) setSelectedTopicId('');
                            await loadTopics();
                            await loadSources('');
                            toast('Topic deleted', 'success');
                          } catch (err: any) {
                            toast(String(err?.message || 'Failed to delete topic'), 'error');
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
            {topics.length === 0 && (
              <li className="text-sm text-gray-600 dark:text-gray-300">No monitored topics yet.</li>
            )}
          </ul>
        </div>

        {/* Sources */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sources</h3>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Topic: <span className="font-semibold">{selectedTopic?.topic || '—'}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              value={newSourceUrl}
              onChange={(e) => setNewSourceUrl(e.target.value)}
              placeholder="Add RSS/Atom feed URL"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <Button
              size="sm"
              onClick={async () => {
                const url = newSourceUrl.trim();
                if (!selectedTopicId) {
                  toast('Select a topic first', 'error');
                  return;
                }
                if (!url) return;
                try {
                  await apiPost('/update-agent/sources', {
                    topicId: selectedTopicId,
                    url,
                    enabled: true,
                    sourceType: 'rss',
                    position: sources.length,
                  });
                  setNewSourceUrl('');
                  await loadSources(selectedTopicId);
                  toast('Source added', 'success');
                } catch (e: any) {
                  toast(String(e?.message || 'Failed to add source'), 'error');
                }
              }}
              disabled={!selectedTopicId}
            >
              Add
            </Button>
          </div>

          <ul role="list" className="space-y-2">
            {sources.map((s) => {
              const enabled = s.enabled !== false;
              return (
                <li
                  key={s.id}
                  role="listitem"
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-mono text-gray-900 dark:text-white break-all">
                        {s.url}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {enabled ? 'Enabled' : 'Disabled'} · Type: {s.sourceType || 'rss'} ·
                        Position: {Number.isFinite(s.position) ? s.position : 0}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        Last checked: {fmt(s.lastCheckedAt)} · Last success: {fmt(s.lastSuccessAt)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        Next eligible: {fmt(s.nextEligibleAt)} · Failure count:{' '}
                        {Number.isFinite(s.failureCount) ? s.failureCount : 0}
                      </div>
                      {s.lastError ? (
                        <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                          Last error: {s.lastError}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <label className="text-xs text-gray-700 dark:text-gray-200 inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={async (e) => {
                            try {
                              await apiPost('/update-agent/sources/update', {
                                id: s.id,
                                enabled: e.target.checked,
                              });
                              await loadSources(selectedTopicId);
                              toast('Source updated', 'success');
                            } catch (err: any) {
                              toast(String(err?.message || 'Failed to update source'), 'error');
                            }
                          }}
                        />
                        Enabled
                      </label>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={async () => {
                          if (!confirm('Delete this source?')) return;
                          try {
                            await apiDelete(`/update-agent/sources/${s.id}`);
                            await loadSources(selectedTopicId);
                            toast('Source deleted', 'success');
                          } catch (err: any) {
                            toast(String(err?.message || 'Failed to delete source'), 'error');
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
            {sources.length === 0 && (
              <li className="text-sm text-gray-600 dark:text-gray-300">No sources yet.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
