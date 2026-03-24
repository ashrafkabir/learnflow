import React from 'react';
import type { PipelineState } from '../../hooks/usePipeline.js';

const LABELS: Record<string, string> = {
  plan_ready: 'Plan ready',
  sources_ready: 'Sources ready',
  draft_ready: 'Draft ready',
  quality_passed: 'Quality passed',
};

export function LessonMilestones({ state }: { state: PipelineState }) {
  const items = Array.isArray(state.lessonMilestones) ? state.lessonMilestones : [];
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
        Lesson milestones
      </p>
      <div className="space-y-1">
        {items.slice(-40).map((m, idx) => {
          const ts = m.ts ? new Date(m.ts).toLocaleTimeString() : '';
          return (
            <div
              key={`${m.lessonId}-${m.type}-${idx}`}
              className="text-[11px] text-gray-600 dark:text-gray-300 flex items-center justify-between gap-3 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white/60 dark:bg-gray-900/30"
            >
              <span className="truncate">
                <span className="font-medium">{m.lessonTitle || m.lessonId}</span> ·{' '}
                {LABELS[m.type] || m.type}
              </span>
              <span className="text-gray-400 dark:text-gray-500 whitespace-nowrap">{ts}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
