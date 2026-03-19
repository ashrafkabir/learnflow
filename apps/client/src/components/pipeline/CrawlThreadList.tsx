import React from 'react';
import type { CrawlThread } from '../../hooks/usePipeline.js';
import { IconCheck, IconRefresh, IconX } from '../icons/index.js';

export function CrawlThreadList({ threads }: { threads?: CrawlThread[] }) {
  const safeThreads = threads ?? [];
  if (!safeThreads.length)
    return <p className="text-gray-400 text-center py-2">Starting crawl...</p>;

  return (
    <div className="space-y-2">
      {safeThreads.map((t) => (
        <div
          key={t.id}
          className="bg-white dark:bg-gray-900 rounded-lg p-2 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center gap-2">
            {t.status === 'pending' && <span className="text-gray-400">•</span>}
            {t.status === 'crawling' && (
              <span className="animate-spin">
                <IconRefresh size={14} className="text-gray-600 dark:text-gray-300" decorative />
              </span>
            )}
            {t.status === 'done' && <IconCheck size={14} className="text-teal-500" decorative />}
            {t.status === 'failed' && <IconX size={14} className="text-red-500" decorative />}
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
