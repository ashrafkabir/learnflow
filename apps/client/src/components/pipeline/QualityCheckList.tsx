import React from 'react';
import type { QualityCheck } from '../../hooks/usePipeline.js';

export function QualityCheckList({ results }: { results?: QualityCheck[] }) {
  const safeResults = results ?? [];
  if (!safeResults.length)
    return <p className="text-gray-400 text-center py-2">Running checks...</p>;

  return (
    <div className="space-y-1.5">
      {safeResults.map((r) => (
        <div
          key={r.lessonId}
          className="bg-white dark:bg-gray-900 rounded-lg px-2 py-1.5 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center gap-2">
            <span className={r.overallPass ? 'text-teal-500' : 'text-amber-500'}>
              {r.overallPass ? '✓' : '⚠'}
            </span>
            <span className="truncate font-medium text-gray-700 dark:text-gray-300">
              {r.lessonTitle}
            </span>
          </div>
          <div className="flex gap-2 mt-1 pl-5">
            <CheckBadge pass={r.checks.wordCount.pass} label={`${r.checks.wordCount.value}w`} />
            <CheckBadge
              pass={r.checks.objectives.pass}
              label={`${r.checks.objectives.count} obj`}
            />
            <CheckBadge pass={r.checks.sources.pass} label={`${r.checks.sources.count} src`} />
            <CheckBadge pass={r.checks.readability.pass} label={`${r.checks.readability.score}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CheckBadge({ pass, label }: { pass: boolean; label: string }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
        pass
          ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
          : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
      }`}
    >
      {label}
    </span>
  );
}
