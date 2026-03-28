import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { IconMail, IconSparkles } from '../components/icons/index.js';

/* Pipeline stage label → color mapping */
const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  scraping: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
  organizing: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-800 dark:text-purple-300',
  },
  synthesizing: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-800 dark:text-indigo-300',
  },
  quality_check: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-300',
  },
  reviewing: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-300',
  },
  published: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-300',
  },
  failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300' },
};

interface MockPipeline {
  id: string;
  topic: string;
  stage: string;
  progress: number;
  startedAt: string;
  moduleCount: number;
  lessonCount: number;
}

const MOCK_PIPELINES: MockPipeline[] = [
  {
    id: 'p-1',
    topic: 'Machine Learning Fundamentals',
    stage: 'published',
    progress: 1,
    startedAt: '2025-07-20T10:00:00Z',
    moduleCount: 5,
    lessonCount: 20,
  },
  {
    id: 'p-2',
    topic: 'Advanced TypeScript Patterns',
    stage: 'synthesizing',
    progress: 0.65,
    startedAt: '2025-07-21T14:30:00Z',
    moduleCount: 3,
    lessonCount: 12,
  },
  {
    id: 'p-3',
    topic: 'Kubernetes in Production',
    stage: 'scraping',
    progress: 0.2,
    startedAt: '2025-07-22T09:00:00Z',
    moduleCount: 0,
    lessonCount: 0,
  },
  {
    id: 'p-4',
    topic: 'React Performance Optimization',
    stage: 'quality_check',
    progress: 0.85,
    startedAt: '2025-07-21T16:45:00Z',
    moduleCount: 4,
    lessonCount: 16,
  },
  {
    id: 'p-5',
    topic: 'Data Engineering with Python',
    stage: 'failed',
    progress: 0.4,
    startedAt: '2025-07-19T08:00:00Z',
    moduleCount: 2,
    lessonCount: 6,
  },
];

function StageBadge({ stage }: { stage: string }) {
  const colors = STAGE_COLORS[stage] || {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${colors.bg} ${colors.text}`}
    >
      {stage === 'quality_check' ? 'Quality Check' : stage}
    </span>
  );
}

export function PipelineViewScreen() {
  const nav = useNavigate();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');

  const filtered = MOCK_PIPELINES.filter((p) => {
    if (filter === 'active') return !['published', 'failed'].includes(p.stage);
    if (filter === 'completed') return p.stage === 'published';
    if (filter === 'failed') return p.stage === 'failed';
    return true;
  });

  return (
    <section className="min-h-screen bg-bg dark:bg-bg-dark" aria-label="Pipeline Overview">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Pipelines</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {MOCK_PIPELINES.length} pipelines ·{' '}
              {MOCK_PIPELINES.filter((p) => !['published', 'failed'].includes(p.stage)).length}{' '}
              active
            </p>
          </div>
          <Button variant="primary" onClick={() => nav('/conversation')}>
            <span className="inline-flex items-center gap-2">
              <IconSparkles size={16} className="text-white" decorative />
              Start New Course
            </span>
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 text-sm text-accent font-medium">
          <p className="font-semibold">MVP note: “Publish” is internal</p>
          <p className="mt-1 text-accent/90">
            In Course Pipelines, <span className="font-semibold">Publish</span> means the pipeline
            has produced a course artifact inside your LearnFlow workspace. It does{' '}
            <span className="font-semibold">not</span> automatically publish to the public
            Marketplace.
          </p>
        </div>
        {/* Filter Tabs */}
        <div className="flex gap-2" role="tablist" aria-label="Pipeline filter">
          {(['all', 'active', 'completed', 'failed'] as const).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
                filter === f
                  ? 'bg-accent text-white shadow-card'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {f}{' '}
              {f === 'all'
                ? `(${MOCK_PIPELINES.length})`
                : `(${
                    MOCK_PIPELINES.filter((p) => {
                      if (f === 'active') return !['published', 'failed'].includes(p.stage);
                      if (f === 'completed') return p.stage === 'published';
                      return p.stage === 'failed';
                    }).length
                  })`}
            </button>
          ))}
        </div>

        {/* Pipeline Cards */}
        <div className="space-y-4">
          {filtered.map((pipeline) => {
            const pct = Math.round(pipeline.progress * 100);
            return (
              <div
                key={pipeline.id}
                onClick={() => nav(`/pipeline/${pipeline.id}`)}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-5 cursor-pointer hover:shadow-elevated hover:border-accent/30 transition-all"
                role="listitem"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {pipeline.topic}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Started {new Date(pipeline.startedAt).toLocaleDateString()} ·{' '}
                      {pipeline.moduleCount} modules · {pipeline.lessonCount} lessons
                    </p>
                  </div>
                  <StageBadge stage={pipeline.stage} />
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pipeline.stage === 'failed'
                          ? 'bg-red-500'
                          : pipeline.stage === 'published'
                            ? 'bg-green-500'
                            : 'bg-accent'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-12 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <div className="flex justify-center mb-2">
                <IconMail size={34} className="text-gray-400 dark:text-gray-500" decorative />
              </div>
              <p className="text-lg font-medium">No pipelines match this filter</p>
              <p className="text-sm mt-1">Try a different filter or start a new course.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
