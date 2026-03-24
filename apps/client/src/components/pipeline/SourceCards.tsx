import React from 'react';

import type { SourceCard } from '../../hooks/usePipeline.js';

export function SourceCards({ cards }: { cards?: SourceCard[] }) {
  const safe = cards ?? [];
  if (safe.length === 0) {
    return <p className="text-gray-400 text-center py-2">No source cards yet.</p>;
  }

  return (
    <div className="space-y-2">
      {safe.slice(0, 20).map((c) => (
        <div
          key={c.url}
          className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-start justify-between gap-3">
            <a
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-indigo-700 dark:text-indigo-300 hover:underline break-words"
            >
              {c.title || c.url}
            </a>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex-shrink-0">
              {String(c.provider || 'web').toUpperCase()}
            </span>
          </div>
          {c.summary ? (
            <p className="text-[11px] text-gray-700 dark:text-gray-200 mt-1">{c.summary}</p>
          ) : null}
          {c.relevance ? (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{c.relevance}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(c.keyConcepts || []).slice(0, 6).map((t) => (
              <span
                key={t}
                className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-200"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="text-[10px] text-gray-400 mt-2">
            Accessed: {c.accessedAt ? new Date(c.accessedAt).toLocaleString() : 'N/A'}
          </div>
        </div>
      ))}
      {safe.length > 20 ? (
        <p className="text-[10px] text-gray-400 text-center">Showing 20 of {safe.length} cards</p>
      ) : null}
    </div>
  );
}
