import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePipeline } from '../hooks/usePipeline.js';
import { PipelineView } from '../components/pipeline/PipelineView.js';

export function PipelineDetail() {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const nav = useNavigate();
  const { state } = usePipeline(pipelineId || null);

  if (!state) {
    return (
      <section className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
            <button onClick={() => nav('/dashboard')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">← Back</button>
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-6 w-48" />
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl h-16" />
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full h-2" />
          <div className="flex gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-2xl h-40 w-48 flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => nav('/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Course Pipeline
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{state.topic}</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <PipelineView
          state={state}
          onViewCourse={(courseId) => nav(`/courses/${courseId}`)}
        />
      </div>
    </section>
  );
}
