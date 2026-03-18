import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LessonSynthesis } from '../../hooks/usePipeline.js';

export function SynthesisList({ lessons, courseId }: { lessons: LessonSynthesis[]; courseId?: string }) {
  const nav = useNavigate();
  if (!lessons.length) return <p className="text-gray-400 text-center py-2">Preparing...</p>;

  const doneLessons = lessons.filter(l => l.status === 'done');
  const stillGenerating = lessons.some(l => l.status === 'generating' || l.status === 'pending');

  return (
    <div className="space-y-1.5">
      {/* Early access CTA */}
      {doneLessons.length > 0 && stillGenerating && courseId && (
        <button
          onClick={() => nav(`/courses/${courseId}`)}
          className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors mb-2 animate-pulse"
        >
          ▶ Start reading ({doneLessons.length} lesson{doneLessons.length > 1 ? 's' : ''} ready)
        </button>
      )}
      {lessons.map(l => (
        <div key={l.lessonId} className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg px-2 py-1.5 border border-gray-100 dark:border-gray-700">
          {l.status === 'pending' && <span className="text-gray-400 text-[10px]">○</span>}
          {l.status === 'generating' && (
            <span className="inline-block w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          )}
          {l.status === 'done' && <span className="text-teal-500 text-[10px]">✓</span>}
          {l.status === 'failed' && <span className="text-red-500 text-[10px]">✗</span>}
          <div className="flex-1 min-w-0">
            <p className="truncate text-gray-700 dark:text-gray-300">{l.lessonTitle}</p>
            {l.status === 'done' && (
              <p className="text-gray-400">{l.wordCount} words · {l.sourcesUsed} sources</p>
            )}
            {l.status === 'generating' && (
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-sky-400 rounded-full animate-pulse w-2/3" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
