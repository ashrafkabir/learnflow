import React from 'react';

import type { PipelineSource } from '../../hooks/usePipeline.js';

export function SourceList({ sources }: { sources?: PipelineSource[] }) {
  const safe = sources ?? [];
  if (safe.length === 0) {
    return <p className="text-gray-400 text-center py-2">No sources captured yet.</p>;
  }

  return (
    <div className="space-y-2">
      {safe.slice(0, 12).map((s) => (
        <div
          key={s.url}
          className="bg-white dark:bg-gray-900 rounded-lg p-2 border border-gray-100 dark:border-gray-700"
        >
          <a
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-indigo-700 dark:text-indigo-300 hover:underline break-words"
          >
            {s.title || s.url}
          </a>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
            {(s.domain || '').toUpperCase()}
            {s.author ? ` · ${s.author}` : ''}
            {s.publishDate ? ` · ${new Date(s.publishDate).getFullYear()}` : ''}
            {typeof s.credibilityScore === 'number' ? ` · score ${s.credibilityScore}` : ''}
          </div>
        </div>
      ))}
      {safe.length > 12 && (
        <p className="text-[10px] text-gray-400 text-center">Showing 12 of {safe.length} sources</p>
      )}
    </div>
  );
}
