import React from 'react';
import { Button } from './Button.js';
import { IconClose, IconMap } from './icons/index.js';

// Dynamically import vis-network to avoid SSR issues
let Network: unknown = null;
let DataSet: unknown = null;

type VisDataSetCtor = new (items: Array<Record<string, unknown>>) => unknown;

type VisNetworkCtor = new (
  container: HTMLElement,
  data: Record<string, unknown>,
  options: Record<string, unknown>,
) => {
  on: (event: string, cb: (params: unknown) => void) => void;
  destroy: () => void;
  fit: (...args: unknown[]) => void;
};

export type LessonMindmapSuggestion = {
  id: string;
  label: string;
  reason?: string;
};

function sectionHeadingsFromMarkdown(md: string): string[] {
  const lines = String(md || '').split('\n');
  const headings: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\s{0,3}(#{1,3})\s+(.+?)\s*$/);
    if (m) {
      const label = m[2].replace(/\[[^\]]+\]\([^)]*\)/g, '$1').trim();
      if (label && label.length <= 70) headings.push(label);
    }
  }
  return Array.from(new Set(headings)).slice(0, 10);
}

export function LessonMindmap({
  open,
  onClose,
  lessonTitle,
  lessonContent,
  suggestions,
}: {
  open: boolean;
  onClose: () => void;
  lessonTitle: string;
  lessonContent: string;
  suggestions: LessonMindmapSuggestion[];
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const networkRef = React.useRef<{ destroy: () => void } | null>(null);
  const [loaded, setLoaded] = React.useState(!!Network);

  const dataRef = React.useRef<{ nodes: any; edges: any } | null>(null);

  React.useEffect(() => {
    if (Network) {
      setLoaded(true);
      return;
    }
    import('vis-network/standalone')
      .then((mod) => {
        Network = (mod as any).Network;
        DataSet = (mod as any).DataSet;
        setLoaded(true);
      })
      .catch((err) => {
        // iOS/Safari can fail dynamic import in some edge cases; don't fail silently.
        console.warn('[LessonMindmap] failed to load vis-network', err);
      });
  }, []);

  const buildGraph = React.useCallback(() => {
    const headings = sectionHeadingsFromMarkdown(lessonContent);
    const nodes: Array<Record<string, unknown>> = [];
    const edges: Array<Record<string, unknown>> = [];

    let nodeId = 1;
    const rootId = nodeId++;
    nodes.push({
      id: rootId,
      label: lessonTitle.slice(0, 40) || 'Lesson',
      shape: 'ellipse',
      color: { background: '#0EA5E9', border: '#0284C7' },
      font: { color: '#fff', size: 13 },
      size: 26,
    });

    for (const h of headings) {
      const id = nodeId++;
      nodes.push({
        id,
        label: h.slice(0, 34),
        shape: 'box',
        color: { background: '#E0F2FE', border: '#7DD3FC' },
        font: { color: '#0F172A', size: 11 },
        _kind: 'section',
      });
      edges.push({ from: rootId, to: id, color: { color: '#94A3B8' } });
    }

    for (const s of suggestions.slice(0, 6)) {
      const id = nodeId++;
      nodes.push({
        id,
        label: s.label.slice(0, 34),
        shape: 'box',
        color: { background: '#FFFFFF', border: '#A78BFA' },
        font: { color: '#6D28D9', size: 11 },
        _kind: 'suggestion',
        _suggestionId: s.id,
      });
      edges.push({
        from: rootId,
        to: id,
        dashes: true,
        color: { color: '#A78BFA' },
      });
    }

    return { nodes, edges };
  }, [lessonTitle, lessonContent, suggestions]);

  // Create the network once when opening; update datasets on subsequent renders.
  React.useEffect(() => {
    if (!open || !loaded || !containerRef.current || !Network || !DataSet) return;

    const DataSetCtor = DataSet as VisDataSetCtor;
    const NetworkCtor = Network as VisNetworkCtor;

    if (!networkRef.current) {
      const g = buildGraph();
      const nodesDs = new DataSetCtor(g.nodes);
      const edgesDs = new DataSetCtor(g.edges);
      dataRef.current = { nodes: nodesDs, edges: edgesDs };

      const net = new NetworkCtor(
        containerRef.current,
        { nodes: nodesDs, edges: edgesDs },
        {
          layout: { hierarchical: false },
          physics: {
            enabled: true,
            forceAtlas2Based: { gravitationalConstant: -25, springLength: 85 },
            solver: 'forceAtlas2Based',
            stabilization: { iterations: 60 },
          },
          interaction: { hover: true, keyboard: { enabled: true } },
          nodes: { borderWidth: 2, font: { size: 11, face: 'system-ui' } },
          edges: { smooth: { type: 'continuous' } },
        },
      );

      networkRef.current = net as any;

      net.on('click', (params: any) => {
        try {
          const clickedNodeId = params?.nodes?.[0];
          if (!clickedNodeId) return;
          const label = String(
            (dataRef.current?.nodes as any)?.get?.(clickedNodeId)?.label || '',
          ).trim();
          if (!label) return;
          void navigator.clipboard?.writeText(label);
        } catch {
          // ignore
        }
      });

      // iOS/Safari: layout can be 0px at first paint; fit on next frames.
      requestAnimationFrame(() => requestAnimationFrame(() => (net as any).fit?.()));
    } else {
      const g = buildGraph();
      const ds = dataRef.current;
      // Best-effort DataSet updates
      try {
        ds?.nodes?.clear?.();
        ds?.edges?.clear?.();
        ds?.nodes?.add?.(g.nodes);
        ds?.edges?.add?.(g.edges);
      } catch {
        // ignore
      }
      (networkRef.current as any)?.fit?.();
    }
  }, [open, loaded, buildGraph]);

  // Destroy only when closing.
  React.useEffect(() => {
    if (open) return;
    networkRef.current?.destroy();
    networkRef.current = null;
    dataRef.current = null;
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <aside
        className="fixed top-0 right-0 h-full w-full md:w-[420px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-50 flex flex-col shadow-modal"
        aria-label="Lesson mindmap"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-accent" aria-hidden>
              <IconMap size={16} />
            </span>
            Lesson Map
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close lesson mindmap">
            <IconClose size={16} className="text-gray-700 dark:text-gray-200" decorative />
          </Button>
        </div>

        <div
          ref={containerRef}
          className="flex-1 min-h-0 h-full"
          style={{ minHeight: 320 }}
          tabIndex={0}
          role="img"
          aria-label="Lesson mindmap graph"
        />

        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
            Loading mindmap…
          </div>
        )}

        <p className="text-[10px] text-gray-400 px-3 py-2 text-center">
          Sections are extracted from headings • Suggested nodes are dashed
        </p>
      </aside>
    </>
  );
}
