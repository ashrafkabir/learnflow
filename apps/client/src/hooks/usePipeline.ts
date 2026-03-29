import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet, apiPost } from '../context/AppContext.js';

export type PipelineStage =
  | 'scraping'
  | 'organizing'
  | 'synthesizing'
  | 'quality_check'
  | 'reviewing'
  | 'published'
  | 'personal'
  | 'failed';

export interface CrawlThread {
  id: string;
  url: string;
  status: 'pending' | 'crawling' | 'done' | 'failed';
  title?: string;
  contentPreview?: string;
  wordCount?: number;
}

export interface PipelineSource {
  url: string;
  title: string;
  domain?: string;
  author?: string;
  publishDate?: string;
  credibilityScore?: number;
  provider?: string;
  summary?: string;
}

export interface SourceCard {
  title: string;
  url: string;
  provider: string;
  summary: string;
  relevance: string;
  keyConcepts: string[];
  accessedAt: string;
  sourceType?: 'docs' | 'blog' | 'paper' | 'forum';
  whyThisMatters?: string;
}

export interface LessonSynthesis {
  lessonId: string;
  lessonTitle: string;
  status: 'pending' | 'generating' | 'done' | 'failed';
  wordCount: number;
  sourcesUsed: number;
}

export interface QualityCheck {
  lessonId: string;
  lessonTitle: string;
  checks: {
    wordCount: { pass: boolean; value: number; min: number };
    objectives: { pass: boolean; count: number; min: number };
    takeaways: { pass: boolean; count: number; min: number };
    sources: { pass: boolean; count: number; min: number };
    readability: { pass: boolean; score: number };
  };
  overallPass: boolean;
}

export type PipelineRunStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface PipelineState {
  id: string;
  courseId: string;
  topic: string;
  status: PipelineRunStatus;
  stage: PipelineStage;
  progress: number;
  startedAt: string;
  updatedAt: string;
  finishedAt?: string;
  failReason?: string;
  logs?: Array<{ ts: string; level: 'info' | 'warn' | 'error'; message: string }>;
  lessonMilestones?: Array<{
    lessonId: string;
    lessonTitle: string;
    type: 'plan_ready' | 'sources_ready' | 'draft_ready' | 'quality_passed';
    ts: string;
  }>;
  crawlThreads: CrawlThread[];
  sources?: PipelineSource[];
  sourceCards?: SourceCard[];
  synthesisSummary?: string;
  organizedSources: number;
  deduplicatedCount: number;
  credibilityScores: number[];
  themes: string[];
  lessonSyntheses: LessonSynthesis[];
  qualityResults: QualityCheck[];
  courseTitle?: string;
  courseDescription?: string;
  moduleCount?: number;
  lessonCount?: number;
  error?: string;
  sourceMode?: 'real' | 'mock';
}

// NOTE: Prefer apiGet/apiPost for auth + consistent error handling.

export function usePipeline(pipelineId: string | null) {
  const [state, setState] = useState<PipelineState | null>(null);
  const [complete, setComplete] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!pipelineId) return;

    // NOTE: Our API uses Bearer tokens; native EventSource cannot attach Authorization headers.
    // To avoid silent failures / blank pipeline views, we use authenticated polling via apiGet.
    let cancelled = false;

    const fetchOnce = async () => {
      try {
        const data = (await apiGet(`/pipeline/${pipelineId}`)) as PipelineState;
        if (cancelled) return;
        if (data) setState(data);

        if (['reviewing', 'published', 'personal', 'failed'].includes(data.stage)) {
          setComplete(
            data.stage === 'reviewing' || data.stage === 'published' || data.stage === 'personal',
          );
          return true;
        }
      } catch {
        // apiGet handles 401 redirect; other errors are ignored here to keep UI resilient.
      }
      return false;
    };

    // Kick off immediately, then poll until completed.
    void fetchOnce();
    const interval = window.setInterval(async () => {
      const done = await fetchOnce();
      if (done) window.clearInterval(interval);
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      esRef.current?.close();
    };
  }, [pipelineId]);

  return { state, complete };
}

export function useStartPipeline() {
  const [loading, setLoading] = useState(false);

  const start = useCallback(
    async (topic: string): Promise<{ pipelineId: string; courseId: string } | null> => {
      setLoading(true);
      try {
        const data = await apiPost('/pipeline', { topic });
        if (!data?.pipelineId) return null;
        return data;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { start, loading };
}

export function usePipelineList() {
  const [pipelines, setPipelines] = useState<PipelineState[]>([]);

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet('/pipeline');
      setPipelines(data.pipelines || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { pipelines, refresh };
}
