import React from 'react';
import type { CrawlThread } from '../../hooks/usePipeline.js';

export function CrawlThreadList({ threads }: { threads: CrawlThread[] }) {
  if (!threads.length) return <p className="text-gray-400 text-center py-2">Starting crawl...</p>;

  return (
    <div className="space-y-2">
      {threads.map(t => (
        <div key={t.id} className="bg-white dark:bg-gray-900 rounded-lg p-2 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {t.status === 'pending' && <span className="text-gray-400">○</span>}
            {t.status === 'crawling' && <span className="animate-spin">⟳</span>}
            {t.status === 'done' && <span className="text-teal-500">✓</span>}
            {t.status === 'failed' && <span className="text-red-500">✗</span>}
            <span className="truncate font-medium text-gray-700 dark:text-gray-300">
              {t.title || t.url}
            </span>
          </div>
          {t.contentPreview && (
            <p className="text-gray-400 truncate mt-1 pl-5">{t.contentPreview}</p>
          )}
          {t.wordCount != null && t.wordCount > 0 && (
            <p className="text-gray-400 pl-5 mt-0.5">{t.wordCount.toLocaleString()} words</p>
          )}
        </div>
      ))}
    </div>
  );
}
