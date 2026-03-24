import React, { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../context/AppContext.js';
import { fetchUsageAggregates, type UsageAggregates, type UsageSummary } from '../lib/usage.js';

type WindowKey = '7' | '30';

function formatIsoDate(iso?: string | null): string {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return 'Never';
  }
}

function ProviderBreakdown({ summary }: { summary: UsageSummary }) {
  const providers = summary.providerMeta || [];

  if (!providers.length) {
    return <div className="text-sm text-gray-500 dark:text-gray-300">No usage yet</div>;
  }

  return (
    <div className="space-y-2">
      {providers.map((p) => (
        <div key={p.provider} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {p.provider}
            </div>
            <div className="font-mono text-sm text-gray-700 dark:text-gray-200">{p.total}</div>
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
            <span>Calls: {p.callCount}</span>
            <span>Last used: {formatIsoDate(p.lastUsed)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TopAgents({ summary }: { summary: UsageSummary }) {
  const agents = summary.topAgents || [];

  if (!agents.length) {
    return <div className="text-sm text-gray-500 dark:text-gray-300">No usage yet</div>;
  }

  return (
    <ul className="space-y-1">
      {agents.slice(0, 8).map((a) => (
        <li key={a.agentName} className="flex items-center justify-between text-sm">
          <span className="text-gray-900 dark:text-white">{a.agentName}</span>
          <span className="font-mono text-gray-700 dark:text-gray-200">{a.total}</span>
        </li>
      ))}
    </ul>
  );
}

export function UsageDashboard() {
  const [agg, setAgg] = useState<UsageAggregates | null>(null);
  const [windowKey, setWindowKey] = useState<WindowKey>('7');

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchUsageAggregates(apiGet);
        setAgg(data);
      } catch {
        setAgg(null);
      }
    })();
  }, []);

  const summary = useMemo(() => {
    if (!agg?.data) return null;
    return agg.data[windowKey] || null;
  }, [agg, windowKey]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Usage</h2>
          <p className="text-xs text-gray-800/80 dark:text-gray-200">
            Token counts are an estimate. Costs vary by provider/model.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWindowKey('7')}
            className={`px-3 py-1.5 rounded-xl text-sm border ${
              windowKey === '7'
                ? 'bg-accent text-white border-accent'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
            }`}
          >
            7 days
          </button>
          <button
            type="button"
            onClick={() => setWindowKey('30')}
            className={`px-3 py-1.5 rounded-xl text-sm border ${
              windowKey === '30'
                ? 'bg-accent text-white border-accent'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
            }`}
          >
            30 days
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-800/80 dark:text-gray-200 flex items-center justify-between">
        <span>Total tokens</span>
        <span className="font-mono">{summary ? summary.totalTokens : 0}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-xs text-gray-500 dark:text-gray-300">Providers</div>
          <div className="mt-2">
            {summary ? <ProviderBreakdown summary={summary} /> : null}
            {!summary ? (
              <div className="text-sm text-gray-500 dark:text-gray-300">No usage yet</div>
            ) : null}
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-xs text-gray-500 dark:text-gray-300">Top agents</div>
          <div className="mt-2">{summary ? <TopAgents summary={summary} /> : null}</div>
        </div>
      </div>
    </div>
  );
}
