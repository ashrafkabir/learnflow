import React, { useState, useEffect } from 'react';
import type { PipelineState, PipelineStage } from '../../hooks/usePipeline.js';
import { StageColumn } from './StageColumn.js';
import { CrawlThreadList } from './CrawlThreadList.js';
import { SourceList } from './SourceList.js';
import { SourceCards } from './SourceCards.js';
import { SynthesisList } from './SynthesisList.js';
import { QualityCheckList } from './QualityCheckList.js';
import { OrganizingView } from './OrganizingView.js';
import { LessonMilestones } from './LessonMilestones.js';
import {
  IconChart,
  IconCheck,
  IconDocument,
  IconPencil,
  IconRobot,
  IconSearch,
} from '../icons/index.js';

const STAGES: {
  key: PipelineStage;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string; decorative?: boolean }>;
}[] = [
  { key: 'scraping', label: 'Discovery', Icon: IconSearch },
  { key: 'organizing', label: 'Extract', Icon: IconChart },
  { key: 'synthesizing', label: 'Synthesize', Icon: IconRobot },
  { key: 'quality_check', label: 'Course update', Icon: IconCheck },
  { key: 'reviewing', label: 'Review', Icon: IconDocument },
];

function stageIndex(stage: PipelineStage): number {
  const idx = STAGES.findIndex((s) => s.key === stage);
  return idx >= 0 ? idx : STAGES.length;
}

interface LessonData {
  id: string;
  title: string;
  moduleTitle: string;
  content: string;
  wordCount: number;
  estimatedTime: number;
}

function LessonEditCard({ lesson, pipelineId }: { lesson: LessonData; pipelineId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [content, setContent] = useState(lesson.content);
  const [wordCount, setWordCount] = useState(lesson.wordCount);
  const [loading, setLoading] = useState(false);

  const handleEdit = async () => {
    if (!editPrompt.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch(`/api/v1/pipeline/${pipelineId}/lessons/${lesson.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: editPrompt }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setContent(data.content);
        setWordCount(data.wordCount);
        setEditPrompt('');
        setEditing(false);
      }
    } catch (err) {
      console.error('Edit failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {lesson.title}
          </p>
          <p className="text-xs text-gray-400">
            {lesson.moduleTitle} · {wordCount} words · {lesson.estimatedTime} min
          </p>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {expanded ? '▲' : '▼'}
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className="px-2 py-1 text-xs bg-accent/10 text-accent rounded-lg hover:bg-accent/20 font-medium inline-flex items-center gap-1"
          >
            <IconPencil size={14} className="text-accent" decorative />
            Edit
          </button>
        </div>
      </div>

      {expanded && (
        <div className="text-xs text-gray-600 dark:text-gray-300 max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-3 whitespace-pre-wrap">
          {content.slice(0, 2000)}
          {content.length > 2000 ? '...' : ''}
        </div>
      )}

      {editing && (
        <div className="space-y-2">
          <input
            type="text"
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
            placeholder="e.g. add more code examples, simplify for beginners..."
            className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
            disabled={loading}
          />
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              disabled={loading || !editPrompt.trim()}
              className="px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 font-medium"
            >
              {loading ? 'Updating...' : 'Apply Edit'}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditPrompt('');
              }}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewingPanel({
  state,
  onViewCourse,
}: {
  state: PipelineState;
  onViewCourse?: (courseId: string) => void;
}) {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/pipeline/${state.id}/lessons`)
      .then((r) => (r.ok ? r.json() : Promise.reject('Failed')))
      .then((data) => setLessons(data.lessons || []))
      .catch(() => setLessons([]))
      .finally(() => setLoading(false));
  }, [state.id]);

  const handlePublish = async () => {
    await fetch(`/api/v1/pipeline/${state.id}/publish`, { method: 'POST' });
    // NOTE: This does not publish to the marketplace. It only marks the pipeline stage as published.
    if (onViewCourse) onViewCourse(state.courseId);
  };

  const handlePersonal = async () => {
    await fetch(`/api/v1/pipeline/${state.id}/personal`, { method: 'POST' });
    if (onViewCourse) onViewCourse(state.courseId);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-gray-300">
        Course ready! Review and edit lessons below. (MVP: “Published” is a pipeline status only —
        it does not list your course on the Marketplace.)
      </p>

      {loading ? (
        <p className="text-xs text-gray-400">Loading lessons...</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {lessons.map((l) => (
            <LessonEditCard key={l.id} lesson={l} pipelineId={state.id} />
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {onViewCourse && (
          <button
            onClick={() => onViewCourse(state.courseId)}
            className="flex-1 px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            Review Course →
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handlePublish}
          className="flex-1 px-3 py-2 bg-success/10 text-success rounded-xl text-xs font-semibold hover:bg-success/20 transition-colors border border-success/20"
        >
          Mark Published (personal only)
        </button>
        <button
          onClick={handlePersonal}
          className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
        >
          Keep Personal
        </button>
      </div>
    </div>
  );
}

export function PipelineView({
  state,
  onViewCourse,
}: {
  state: PipelineState;
  onViewCourse?: (courseId: string) => void;
}) {
  const currentIdx = stageIndex(state.stage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {state.courseTitle || `Creating: ${state.topic}`}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            {state.moduleCount
              ? `${state.moduleCount} modules · ${state.lessonCount} lessons`
              : 'Preparing...'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-accent">{state.progress}%</span>
          <p className="text-xs text-gray-400">complete</p>
          {state.sourceMode && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${state.sourceMode === 'real' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}
              title={
                state.sourceMode === 'real'
                  ? 'Provenance: content was generated using live sources fetched at runtime.'
                  : 'Provenance: content was generated in demo/mock mode with placeholder sources.'
              }
            >
              {state.sourceMode === 'real'
                ? 'Provenance: live sources'
                : 'Provenance: mock sources'}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${state.progress}%`,
            background:
              state.stage === 'failed'
                ? '#ef4444'
                : state.stage === 'reviewing'
                  ? 'linear-gradient(90deg, #0ea5e9, #14b8a6)'
                  : '#0ea5e9',
          }}
        />
      </div>

      {/* Pipeline stages — horizontal kanban */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((s, i) => {
          const status = i < currentIdx ? 'complete' : i === currentIdx ? 'active' : 'pending';
          return (
            <StageColumn key={s.key} Icon={s.Icon} label={s.label} status={status}>
              {s.key === 'scraping' && i <= currentIdx && (
                <div className="space-y-2">
                  <CrawlThreadList threads={state.crawlThreads} />
                  <div>
                    <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      Sources discovered
                    </p>
                    <SourceCards cards={state.sourceCards} />
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 mb-1">
                        Raw sources
                      </p>
                      <SourceList sources={state.sources} />
                    </div>
                  </div>
                </div>
              )}
              {s.key === 'organizing' && i <= currentIdx && (
                <OrganizingView
                  sources={state.organizedSources}
                  deduplicated={state.deduplicatedCount}
                  themes={state.themes}
                />
              )}
              {s.key === 'synthesizing' && i <= currentIdx && (
                <div className="space-y-2">
                  {state.synthesisSummary ? (
                    <div className="text-[11px] text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                      <span className="font-semibold">Summary:</span> {state.synthesisSummary}
                    </div>
                  ) : null}

                  <LessonMilestones state={state} />

                  <SynthesisList lessons={state.lessonSyntheses} courseId={state.courseId} />
                </div>
              )}
              {s.key === 'quality_check' && i <= currentIdx && (
                <QualityCheckList results={state.qualityResults} />
              )}
              {s.key === 'reviewing' && status === 'active' && (
                <ReviewingPanel state={state} onViewCourse={onViewCourse} />
              )}
            </StageColumn>
          );
        })}
      </div>

      {/* Error */}
      {state.stage === 'failed' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-2">
          <p className="text-sm text-red-700 dark:text-red-400">
            Pipeline failed: {state.error || 'Unknown error'}
          </p>
          {state.status === 'FAILED' && state.failReason === 'stalled' ? (
            <p className="text-xs text-red-700/80 dark:text-red-400/80">
              This run appears stalled. Use <span className="font-semibold">Restart Pipeline</span>{' '}
              to resume from scratch.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
