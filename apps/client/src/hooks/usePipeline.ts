import { useState, useEffect, useCallback, useRef } from 'react';

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

export interface PipelineState {
  id: string;
  courseId: string;
  topic: string;
  stage: PipelineStage;
  progress: number;
  startedAt: string;
  updatedAt: string;
  crawlThreads: CrawlThread[];
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

const API = '/api/v1';

export function usePipeline(pipelineId: string | null) {
  const [state, setState] = useState<PipelineState | null>(null);
  const [complete, setComplete] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!pipelineId) return;

    // First, fetch current state via GET
    fetch(`${API}/pipeline/${pipelineId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PipelineState | null) => {
        if (!data) return;
        setState(data);
        // If already completed, don't open SSE
        if (['reviewing', 'published', 'personal', 'failed'].includes(data.stage)) {
          setComplete(
            data.stage === 'reviewing' || data.stage === 'published' || data.stage === 'personal',
          );
          return;
        }
        // Open SSE for active pipelines
        const es = new EventSource(`${API}/pipeline/${pipelineId}/events`);
        esRef.current = es;

        es.addEventListener('pipeline:update', (e) => {
          try {
            const d = JSON.parse(e.data) as PipelineState;
            setState(d);
          } catch {
            // ignore malformed SSE payload
          }
        });

        es.addEventListener('pipeline:complete', () => {
          setComplete(true);
          es.close();
        });

        es.onerror = () => {
          es.close();
        };
      })
      .catch(() => {
        // Fallback: try SSE anyway
        const es = new EventSource(`${API}/pipeline/${pipelineId}/events`);
        esRef.current = es;
        es.addEventListener('pipeline:update', (e) => {
          try {
            setState(JSON.parse(e.data));
          } catch {
            // ignore malformed SSE payload
          }
        });
        es.addEventListener('pipeline:complete', () => {
          setComplete(true);
          es.close();
        });
        es.onerror = () => {
          es.close();
        };
      });

    return () => {
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
        const res = await fetch(`${API}/pipeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic }),
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
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
      const res = await fetch(`${API}/pipeline`);
      if (res.ok) {
        const data = await res.json();
        setPipelines(data.pipelines || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { pipelines, refresh };
}
