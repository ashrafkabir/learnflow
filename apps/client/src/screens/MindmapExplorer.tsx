import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, apiGet, apiPost } from '../context/AppContext.js';
import { Button } from '../components/Button.js';
import { IconMap, IconMaximize, IconZoomIn, IconZoomOut } from '../components/icons/index.js';
import { useMindmapYjs } from '../hooks/useMindmapYjs.js';

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
  moveTo: (opts: Record<string, unknown>) => void;
  getScale: () => number;
};

export function MindmapExplorer() {
  const nav = useNavigate();
  const { state, dispatch, addTopicToCourse, webSearch, fetchCourse } = useApp();
  const [focusMode, setFocusMode] = useState(false);
  const [focusHops, _setFocusHops] = useState(2);
  const [focusedNodeId, setFocusedNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const networkRef = useRef<null | {
    destroy: () => void;
    fit: (...args: unknown[]) => void;
    moveTo: (opts: Record<string, unknown>) => void;
    getScale: () => number;
  }>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');

  const [suggestedAction, setSuggestedAction] = useState<null | {
    label: string;
    topicId?: string;
    reason?: string;
    parentLessonId?: string;
  }>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ url: string; title: string; description?: string; source?: string }>
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const mindmapRef = useRef<HTMLDivElement | null>(null);
  // Yjs-backed shared mindmap state (room per course)
  // Tie mindmap room to the user's current context when possible.
  // If a courseId is provided via query params, allow mindmap collaboration even
  // when the local client state has no courses loaded yet.
  const queryCourseId = (() => {
    try {
      return new URLSearchParams(window.location.search).get('courseId');
    } catch {
      return null;
    }
  })();
  // Choose an active course for the mindmap room.
  // IMPORTANT: do not fall back to a synthetic id when the user has 0 courses.
  // Otherwise we incorrectly connect to a "dev-course" room and the empty state never shows.
  const activeCourseId = queryCourseId || state.activeCourse?.id || state.courses?.[0]?.id || null;

  // Shared mindmaps: allow overriding courseId/groupId via query params.
  const [sharedParams, setSharedParams] = useState<{
    courseId: string | null;
    groupId?: string | null;
  }>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const courseId = p.get('courseId') || activeCourseId;
      const groupId = p.get('groupId');
      return { courseId: courseId || null, groupId };
    } catch {
      return { courseId: activeCourseId, groupId: null };
    }
  });

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const courseId = p.get('courseId') || activeCourseId;
      const groupId = p.get('groupId');
      setSharedParams({ courseId: courseId || null, groupId });
    } catch {
      // ignore
    }
  }, [activeCourseId]);

  const { nodes: yNodes, peers } = useMindmapYjs(sharedParams.courseId, {
    groupId: sharedParams.groupId,
  });

  // Dev/test hook: expose the shared Yjs nodes array for Playwright assertions.
  // (vis-network renders to canvas so DOM text isn't stable.)
  useEffect(() => {
    if (import.meta.env.DEV) {
      (globalThis as any).__learnflowMindmapNodes = yNodes;
    }
  }, [yNodes]);

  const [customNodes, setCustomNodes] = useState<Array<{ id: string; label: string }>>([]);

  const persistNoteId = 'mindmap-persistence-note';

  // Keep local customNodes in sync with the shared Yjs doc.
  useEffect(() => {
    const syncFromDoc = () => {
      try {
        const next = (yNodes.toArray() as any[]).map((n) => ({
          id: String(n.id),
          label: String(n.label),
        }));
        setCustomNodes(next);
      } catch {
        // ignore
      }
    };
    syncFromDoc();
    yNodes.observe(syncFromDoc);
    return () => {
      yNodes.unobserve(syncFromDoc);
    };
  }, [yNodes]);

  const addCustomNode = () => {
    if (!newNodeLabel.trim()) return;
    const node = { id: `custom-${Date.now()}`, label: newNodeLabel.trim() };
    yNodes.push([node as any]);
    setNewNodeLabel('');
    setShowAddNode(false);
  };

  // Fetch courses independently on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet('/courses');
        if (data.courses && data.courses.length > 0) {
          const fullCourses = await Promise.all(
            data.courses.map(async (c: { id: string }) => {
              try {
                return await apiGet(`/courses/${c.id}`);
              } catch {
                return null;
              }
            }),
          );
          const valid = fullCourses.filter(Boolean);
          if (valid.length > 0) {
            dispatch({ type: 'SET_COURSES', courses: valid as any });

            // Best-effort: request persisted mindmap suggestions for the active course.
            // This makes suggested nodes “real” (server-backed) rather than only localStorage.
            const firstCourseId = (valid as any[])[0]?.id as string | undefined;
            if (firstCourseId) {
              try {
                // Trigger suggestion generation if none exists.
                await apiPost('/mindmap/suggest', { courseId: firstCourseId });
              } catch {
                // ignore
              }
              try {
                const s = await apiGet(
                  `/mindmap/suggestions?courseId=${encodeURIComponent(firstCourseId)}`,
                );
                if (s?.suggestions) {
                  dispatch({
                    type: 'SET_MINDMAP_SUGGESTIONS',
                    courseId: firstCourseId,
                    suggestions: s.suggestions,
                  });
                }
              } catch {
                // ignore
              }
            }
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // Load vis-network dynamically
  useEffect(() => {
    Promise.all([import('vis-network/standalone')])
      .then(([visModule]) => {
        Network = (visModule as unknown as { Network: unknown }).Network;
        DataSet = (visModule as unknown as { DataSet: unknown }).DataSet;
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(false);
      });
  }, []);

  type MasteryRow = {
    courseId: string;
    lessonId: string;
    masteryLevel: number;
    nextReviewAt: string | null;
    lastQuizScore: number | null;
  };

  const [masteryByLessonId, setMasteryByLessonId] = useState<Record<string, MasteryRow>>({});

  function masteryBucket(
    level: number | null | undefined,
  ): 'new' | 'learning' | 'solid' | 'mastered' {
    const v =
      typeof level === 'number' && Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 0;
    if (v >= 0.85) return 'mastered';
    if (v >= 0.55) return 'solid';
    if (v >= 0.25) return 'learning';
    return 'new';
  }

  function masteryColor(level: number | null | undefined): { background: string; border: string } {
    const b = masteryBucket(level);
    if (b === 'mastered') return { background: '#16A34A', border: '#15803D' };
    if (b === 'solid') return { background: '#2563EB', border: '#1D4ED8' };
    if (b === 'learning') return { background: '#F59E0B', border: '#D97706' };
    return { background: '#9CA3AF', border: '#6B7280' };
  }

  function reviewDue(nextReviewAt: string | null | undefined): boolean {
    if (!nextReviewAt) return false;
    return new Date(nextReviewAt).getTime() <= Date.now();
  }

  // Iter138: fetch mastery rows for all loaded courses so mindmap colors reflect learning state.
  // Best-effort (does not block rendering). Updates on refresh; real-time is optional.
  useEffect(() => {
    if (!state.courses?.length) return;
    let cancelled = false;

    (async () => {
      try {
        const token = localStorage.getItem('learnflow-token') || '';
        const maps = await Promise.all(
          state.courses.map(async (c) => {
            try {
              const res = await fetch(`/api/v1/courses/${c.id}/mastery`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) return [] as MasteryRow[];
              const data = (await res.json()) as { mastery?: MasteryRow[] };
              return Array.isArray(data?.mastery) ? (data.mastery as MasteryRow[]) : [];
            } catch {
              return [] as MasteryRow[];
            }
          }),
        );

        if (cancelled) return;
        const map: Record<string, MasteryRow> = {};
        for (const rows of maps) {
          for (const r of rows || []) {
            if (r?.lessonId) map[String(r.lessonId)] = r;
          }
        }
        setMasteryByLessonId(map);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.courses]);

  useEffect(() => {
    if (!loaded || !containerRef.current || !Network || !DataSet) return;

    const NetworkCtor = Network as VisNetworkCtor;
    const DataSetCtor = DataSet as VisDataSetCtor;
    if (state.courses.length === 0) return;

    // Build the full graph first, then optionally focus-filter it.
    const nodes: Array<Record<string, unknown>> = [];
    const edges: Array<Record<string, unknown>> = [];
    let nodeId = 1;
    const lessonIdToNodeId = new Map<string, number>();

    // Root node
    const rootId = nodeId++;
    nodes.push({
      id: rootId,
      label: 'My Knowledge',
      shape: 'ellipse',
      color: { background: '#6366F1', border: '#4F46E5' },
      font: { color: '#fff', size: 18, bold: { color: '#fff' } },
      size: 40,
    });

    for (const course of state.courses) {
      const courseNodeId = nodeId++;
      const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
      const completedLessons = course.modules.reduce(
        (s, m) => s + m.lessons.filter((l) => state.completedLessons.has(l.id)).length,
        0,
      );
      const coursePct = totalLessons > 0 ? completedLessons / totalLessons : 0;

      // Color by progress level (legacy heuristic).
      // Iter138 TODO: use mastery store for course-level coloring.
      // - not started → gray (#9CA3AF)
      // - in progress → amber (#F59E0B)
      // - complete → green (#16A34A)
      const courseColor = coursePct >= 1 ? '#16A34A' : coursePct > 0 ? '#F59E0B' : '#9CA3AF';
      nodes.push({
        id: courseNodeId,
        label: course.title.length > 50 ? course.title.slice(0, 50) + '…' : course.title,
        title: `${course.title}\n${Math.round(coursePct * 100)}% complete`,
        shape: 'box',
        color: { background: courseColor, border: courseColor },
        font: { color: '#fff', size: 16, multi: 'html' },
        borderWidth: 2,
        _courseId: course.id,
      });
      edges.push({ from: rootId, to: courseNodeId, color: { color: '#94A3B8' }, width: 2.5 });

      for (const mod of course.modules) {
        const modNodeId = nodeId++;
        const modCompleted = mod.lessons.filter((l) => state.completedLessons.has(l.id)).length;
        const modPct = mod.lessons.length > 0 ? modCompleted / mod.lessons.length : 0;
        const modColor = modPct >= 1 ? '#16A34A' : modPct > 0 ? '#F59E0B' : '#D1D5DB';

        nodes.push({
          id: modNodeId,
          label: mod.title.length > 40 ? mod.title.slice(0, 40) + '…' : mod.title,
          title: `${mod.title}\n${modCompleted}/${mod.lessons.length} lessons`,
          shape: 'box',
          color: { background: modColor, border: modColor },
          font: { color: modPct > 0 ? '#fff' : '#374151', size: 14 },
          size: 20,
        });
        edges.push({ from: courseNodeId, to: modNodeId, color: { color: '#94A3B8' }, width: 2 });

        // Derive "in progress" lesson: first incomplete lesson in a module that has at least one completed lesson
        const firstIncompleteLessonId =
          modCompleted > 0 && modCompleted < mod.lessons.length
            ? (mod.lessons.find((l) => !state.completedLessons.has(l.id))?.id ?? null)
            : null;

        for (const lesson of mod.lessons) {
          const lessonNodeId = nodeId++;
          const isComplete = state.completedLessons.has(lesson.id);
          const isInProgress = !isComplete && lesson.id === firstIncompleteLessonId;
          const mastery = masteryByLessonId[String(lesson.id)] || null;
          const mColor = masteryColor(mastery?.masteryLevel);
          const due = reviewDue(mastery?.nextReviewAt);

          const lessonBg = isComplete ? '#16A34A' : mColor.background;
          const lessonBorder = isComplete ? '#15803D' : mColor.border;
          const statusLabel = isComplete
            ? ' (complete)'
            : due
              ? ' (review due)'
              : isInProgress
                ? ' (in progress)'
                : '';
          lessonIdToNodeId.set(lesson.id, lessonNodeId);
          nodes.push({
            id: lessonNodeId,
            label: lesson.title.length > 35 ? lesson.title.slice(0, 35) + '…' : lesson.title,
            title: `${lesson.title}${statusLabel}`,
            shape: due ? 'star' : 'dot',
            color: {
              background: lessonBg,
              border: lessonBorder,
            },
            size: due ? 12 : 10,
            _courseId: course.id,
            _lessonId: lesson.id,
            _masteryBucket: masteryBucket(mastery?.masteryLevel),
            _reviewDue: due,
          });
          edges.push({ from: modNodeId, to: lessonNodeId, color: { color: '#94A3B8' }, width: 2 });
        }
      }
    }

    // Suggested expansion nodes (server-driven) — dashed/dimmed.
    // These are not part of completed curriculum until "accepted".
    const suggestions = Object.values(state.mindmapSuggestions || {}).flat();
    for (const s of suggestions) {
      const sugId = nodeId++;
      // Attach suggested nodes to the root by default.
      // Iter39 Task 7: if the suggestion includes parentLessonId, attach under that lesson.
      const parentLessonId = (s as any).parentLessonId as string | undefined;
      nodes.push({
        id: sugId,
        label: s.label.length > 35 ? s.label.slice(0, 35) + '…' : s.label,
        title: `Suggested topic: ${s.label}${s.reason ? `\n${s.reason}` : ''}`,
        shape: 'dot',
        color: {
          background: 'rgba(99,102,241,0.12)',
          border: 'rgba(99,102,241,0.8)',
        },
        borderWidth: 2,
        opacity: 0.55,
        size: 9,
        dashes: true,
        font: { color: '#4F46E5', size: 12 },
        _suggested: true,
        _suggestedTopicId: s.id,
        _suggestedLabel: s.label,
        _parentLessonId: (s as any).parentLessonId,
      });
      const attachFrom =
        parentLessonId && lessonIdToNodeId.get(parentLessonId)
          ? (lessonIdToNodeId.get(parentLessonId) as number)
          : rootId;

      edges.push({
        from: attachFrom,
        to: sugId,
        color: { color: 'rgba(99,102,241,0.55)' },
        dashes: true,
      });
    }

    // Custom nodes
    for (const cn of customNodes) {
      const cnId = nodeId++;
      nodes.push({
        id: cnId,
        label: cn.label,
        title: cn.label,
        shape: 'diamond',
        color: { background: '#8B5CF6', border: '#7C3AED' },
        font: { color: '#fff', size: 12 },
        size: 18,
      });
      edges.push({ from: rootId, to: cnId, color: { color: '#DDD6FE' }, dashes: true });
    }

    // Focus mode: filter graph to N-hop neighborhood of a selected node.
    let finalNodes = nodes;
    let finalEdges = edges;
    if (focusMode && focusedNodeId) {
      const adj = new Map<number, Set<number>>();
      for (const e of edges) {
        const a = e.from as number;
        const b = e.to as number;
        if (!adj.has(a)) adj.set(a, new Set());
        if (!adj.has(b)) adj.set(b, new Set());
        adj.get(a)!.add(b);
        adj.get(b)!.add(a);
      }
      const keep = new Set<number>();
      let frontier = new Set<number>([focusedNodeId]);
      keep.add(focusedNodeId);
      for (let hop = 0; hop < Math.max(1, focusHops); hop++) {
        const next = new Set<number>();
        for (const id of frontier) {
          for (const nb of adj.get(id) || []) {
            if (!keep.has(nb)) {
              keep.add(nb);
              next.add(nb);
            }
          }
        }
        frontier = next;
      }
      finalNodes = nodes.filter((n) => keep.has(n.id as number));
      finalEdges = edges.filter((e) => keep.has(e.from as number) && keep.has(e.to as number));
    }

    const data: Record<string, unknown> = {
      nodes: new DataSetCtor(finalNodes),
      edges: new DataSetCtor(finalEdges),
    };
    const options: Record<string, unknown> = {
      layout: { hierarchical: { enabled: false } },
      physics: {
        enabled: true,
        forceAtlas2Based: {
          gravitationalConstant: -40,
          centralGravity: 0.005,
          springLength: 120,
          springConstant: 0.04,
        },
        solver: 'forceAtlas2Based',
        stabilization: { iterations: 100 },
      },
      autoResize: true,
      interaction: {
        hover: true,
        tooltipDelay: 200,
        keyboard: { enabled: true, speed: { x: 10, y: 10, zoom: 0.02 } },
      },
      nodes: {
        borderWidth: 2,
        shadow: { enabled: true, size: 4, x: 0, y: 2, color: 'rgba(0,0,0,0.1)' },
        font: { size: 14, face: 'system-ui, sans-serif' },
      },
      edges: { smooth: { type: 'continuous' } },
    };

    const network = new NetworkCtor(containerRef.current, data, options);
    networkRef.current = network as any;

    network.on('stabilizationIterationsDone', () => {
      network.fit({
        animation: { duration: 500, easingFunction: 'easeOutQuart' },
        maxZoomLevel: 1.5,
      });
    });

    network.on('stabilized' as string, () => {
      network.fit({ animation: false, maxZoomLevel: 1.5 });
    });

    network.on('click', (params: unknown) => {
      const p = params as { nodes?: unknown[] };
      if (Array.isArray(p.nodes) && p.nodes.length === 1) {
        const clickedId = p.nodes[0] as number;
        const clickedNode = finalNodes.find((n) => n.id === clickedId);
        if (!clickedNode) return;

        // In focus mode, selecting any node refocuses.
        if (focusMode) {
          setFocusedNodeId(clickedId);
          return;
        }

        const courseId = clickedNode?._courseId as string | undefined;
        const lessonId = clickedNode?._lessonId as string | undefined;
        const suggested = Boolean((clickedNode as any)._suggested);
        if (suggested) {
          const label = ((clickedNode as any)._suggestedLabel as string) || 'Suggested topic';
          const topicId = ((clickedNode as any)._suggestedTopicId as string) || undefined;
          const reason = (clickedNode as any).title as string | undefined;

          // Place the panel near the click (fallback to top-right).
          try {
            const mp = mindmapRef.current?.getBoundingClientRect();
            const ev = params as any;
            const dom = ev?.event?.srcEvent as MouseEvent | undefined;
            if (mp && dom) {
              const x = Math.min(mp.width - 260, Math.max(12, dom.clientX - mp.left + 12));
              const y = Math.min(mp.height - 160, Math.max(12, dom.clientY - mp.top + 12));
              setPanelPos({ x, y });
            } else {
              setPanelPos({ x: 16, y: 16 });
            }
          } catch {
            setPanelPos({ x: 16, y: 16 });
          }

          const parentLessonId = (clickedNode as any)._parentLessonId as string | undefined;
          setSuggestedAction({ label, topicId, reason, parentLessonId });
          setSearchOpen(false);
          setSearchResults([]);
          return;
        }

        if (lessonId && courseId) {
          nav(`/courses/${courseId}/lessons/${lessonId}`);
          return;
        }

        // Spec-ish behavior: concept/module nodes expand into focus mode.
        // (MVP: we don’t have a server-side expansion graph yet, so we reveal neighborhood.)
        const nodeType = String((clickedNode as any)?._type || '').toLowerCase();
        if (nodeType === 'concept' || nodeType === 'module') {
          setFocusedNodeId(clickedId);
          setFocusMode(true);
          return;
        }

        if (courseId) {
          nav(`/courses/${courseId}`);
        } else {
          setFocusedNodeId(clickedId);
        }
      }
    });

    return () => {
      network.destroy();
    };
  }, [
    loaded,
    state.courses,
    state.completedLessons,
    customNodes,
    focusMode,
    focusHops,
    focusedNodeId,
    state.mindmapSuggestions,
    dispatch,
    nav,
  ]);

  return (
    <section
      aria-label="Mindmap Explorer"
      data-screen="mindmap"
      className="min-h-screen bg-bg dark:bg-bg-dark"
    >
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => nav('/dashboard')}>
              ←
            </Button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white inline-flex items-center gap-2">
              <IconMap size={20} className="text-accent" decorative />
              Knowledge Map
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <Button
              variant={focusMode ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setFocusMode(!focusMode);
                // When enabling focus mode without a selected node, keep current view until user clicks a node.
                if (focusMode) setFocusedNodeId(null);
              }}
              title="Focus on a node (N-hop neighborhood)"
            >
              {focusMode ? 'Focus: ON' : 'Focus: OFF'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => networkRef.current?.fit({ animation: { duration: 500 } })}
              title="Fit to screen"
            >
              Fit
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowAddNode(true)}>
              + Add Node
            </Button>
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <span
                className="w-3 h-3 rounded-full inline-block border border-gray-400"
                style={{ background: '#9CA3AF' }}
                aria-hidden="true"
              />{' '}
              New
            </span>
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <span
                className="w-3 h-3 rounded-full inline-block border border-amber-500"
                style={{ background: '#F59E0B' }}
                aria-hidden="true"
              />{' '}
              Learning
            </span>
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <span
                className="w-3 h-3 rounded-full inline-block border border-blue-700"
                style={{ background: '#2563EB' }}
                aria-hidden="true"
              />{' '}
              Solid
            </span>
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <span
                className="w-3 h-3 rounded-full inline-block border border-green-600"
                style={{ background: '#16A34A' }}
                aria-hidden="true"
              />{' '}
              Mastered
            </span>
            <span
              className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300"
              title="Review due"
            >
              <span className="text-[12px] font-bold text-rose-600 dark:text-rose-300" aria-hidden>
                ★
              </span>{' '}
              Due
            </span>
          </div>
        </div>
      </header>
      <main className="px-0 sm:px-1 py-0">
        <div
          ref={mindmapRef}
          data-component="mindmap-preview"
          aria-label="Knowledge mindmap"
          tabIndex={0}
          role="img"
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card overflow-hidden"
          style={{ height: 'calc(100vh - 80px)', position: 'relative' }}
        >
          {state.courses.length === 0 && !sharedParams.courseId ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <div className="flex justify-center mb-4">
                  <IconMap size={44} className="text-accent" decorative />
                </div>
                <p className="text-gray-500 dark:text-gray-300 text-lg">
                  Create a course to see your knowledge map
                </p>
                <Button variant="primary" onClick={() => nav('/dashboard')} className="mt-4">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : !loaded ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-300">
              Loading graph...
            </div>
          ) : (
            <>
              {/* Suggestions tray (Iter164): review + accept/dismiss server-backed suggestions */}
              <div
                className="absolute bottom-4 left-4 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 shadow-card w-[320px] max-w-[calc(100vw-32px)]"
                data-testid="mindmap-suggestions-tray"
              >
                {(() => {
                  const cid = String(
                    sharedParams.courseId || state.activeCourse?.id || state.courses?.[0]?.id || '',
                  );
                  const list = cid ? state.mindmapSuggestions?.[cid] || [] : [];
                  const count = list.length;
                  return (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                          Suggestions {count > 0 ? `(${count})` : ''}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!cid) return;
                            try {
                              await apiPost('/mindmap/suggest', { courseId: cid });
                              const s = await apiGet(
                                `/mindmap/suggestions?courseId=${encodeURIComponent(cid)}`,
                              );
                              if (s?.suggestions) {
                                dispatch({
                                  type: 'SET_MINDMAP_SUGGESTIONS',
                                  courseId: cid,
                                  suggestions: s.suggestions,
                                });
                              }
                            } catch {
                              // ignore
                            }
                          }}
                          title="Generate/refresh suggestions"
                        >
                          Refresh
                        </Button>
                      </div>

                      {count === 0 ? (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          No suggestions yet.
                        </div>
                      ) : (
                        <div className="mt-2 space-y-2 max-h-[180px] overflow-auto pr-1">
                          {list.slice(0, 5).map((s: any) => (
                            <div
                              key={String(s.id)}
                              className="rounded-lg border border-indigo-200 dark:border-indigo-900 bg-white/70 dark:bg-gray-900/40 px-2 py-2"
                            >
                              <div className="text-xs font-medium text-gray-900 dark:text-white">
                                {String(s.label || 'Suggested topic')}
                              </div>
                              {s.reason ? (
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                  {String(s.reason)}
                                </div>
                              ) : null}
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => {
                                    // Prefer the existing on-graph action panel for acceptance UX.
                                    setSuggestedAction({
                                      label: String(s.label || 'Suggested topic'),
                                      topicId: String(s.id),
                                      reason: String(s.reason || ''),
                                      parentLessonId: (s as any).parentLessonId,
                                    });
                                    setPanelPos({ x: 16, y: 16 });
                                  }}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={async () => {
                                    if (!cid) return;
                                    try {
                                      const row = await apiPost('/mindmap/dismiss', {
                                        courseId: cid,
                                        suggestionId: String(s.id),
                                      });
                                      dispatch({
                                        type: 'SET_MINDMAP_SUGGESTIONS',
                                        courseId: cid,
                                        suggestions: row?.suggestions || [],
                                      });
                                    } catch {
                                      // Best-effort local removal
                                      dispatch({
                                        type: 'SET_MINDMAP_SUGGESTIONS',
                                        courseId: cid,
                                        suggestions: list.filter(
                                          (x: any) => String(x?.id) !== String(s.id),
                                        ),
                                      });
                                    }
                                  }}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          ))}
                          {count > 5 ? (
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              Showing 5 of {count}.
                            </div>
                          ) : null}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div ref={containerRef} className="w-full h-full" />

              {suggestedAction && panelPos && (
                <div
                  className="absolute z-20 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-white/95 dark:bg-gray-900/95 shadow-modal p-3 w-[260px]"
                  style={{ left: panelPos.x, top: panelPos.y }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {suggestedAction.label}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-300 mt-0.5">
                        Suggested node
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSuggestedAction(null);
                        setPanelPos(null);
                        setSearchOpen(false);
                        setSearchResults([]);
                      }}
                      aria-label="Close"
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2 mt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        if (!suggestedAction?.label) return;
                        setSearchLoading(true);
                        setSearchOpen(true);
                        try {
                          const data = await webSearch(suggestedAction.label, 5);
                          setSearchResults(
                            Array.isArray((data as any)?.results) ? (data as any).results : [],
                          );
                        } catch (err: any) {
                          dispatch({
                            type: 'ADD_NOTIFICATION',
                            notification: {
                              id: `notif-${Date.now()}`,
                              type: 'system',
                              message: `Search failed: ${err?.message || 'Unknown error'}`,
                              timestamp: new Date().toISOString(),
                              read: false,
                            },
                          });
                          setSearchResults([]);
                        } finally {
                          setSearchLoading(false);
                        }
                      }}
                      disabled={searchLoading}
                    >
                      {searchLoading ? 'Searching…' : 'Search latest'}
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={async () => {
                        const courseId = state.activeCourse?.id || state.courses[0]?.id;
                        if (!courseId) return;
                        setAddLoading(true);
                        try {
                          const result = await addTopicToCourse(courseId, suggestedAction.label, {
                            parentLessonId: suggestedAction.parentLessonId,
                          });

                          // If pipeline started, navigate to pipeline detail for live UX.
                          if (result.pipelineId) {
                            nav(`/pipeline/${result.pipelineId}`);
                            return;
                          }

                          const updatedCourse = result.course;

                          // Refresh (ensures client state is consistent)
                          try {
                            await fetchCourse(updatedCourse.id);
                          } catch {
                            // ignore
                          }

                          // Persist acceptance: remove suggestion from server and local cache
                          const cid = String(updatedCourse.id || courseId || 'global');
                          try {
                            if (suggestedAction.topicId) {
                              const serverRow = await apiPost('/mindmap/accept', {
                                courseId: cid,
                                suggestionId: suggestedAction.topicId,
                              });
                              if (serverRow?.suggestions) {
                                dispatch({
                                  type: 'SET_MINDMAP_SUGGESTIONS',
                                  courseId: cid,
                                  suggestions: serverRow.suggestions,
                                });
                              }
                            }
                          } catch {
                            // Fallback: remove locally even if server accept fails
                            const current = state.mindmapSuggestions?.[cid] || [];
                            const next = current.filter(
                              (s) =>
                                s.id !== suggestedAction.topicId &&
                                s.label !== suggestedAction.label,
                            );
                            dispatch({
                              type: 'SET_MINDMAP_SUGGESTIONS',
                              courseId: cid,
                              suggestions: next,
                            });
                          }

                          dispatch({
                            type: 'ADD_NOTIFICATION',
                            notification: {
                              id: `notif-${Date.now()}`,
                              type: 'system',
                              message: `Added to course: ${suggestedAction.label}`,
                              timestamp: new Date().toISOString(),
                              read: false,
                            },
                          });

                          setSuggestedAction(null);
                          setPanelPos(null);
                          setSearchOpen(false);
                          setSearchResults([]);
                        } catch (err: any) {
                          dispatch({
                            type: 'ADD_NOTIFICATION',
                            notification: {
                              id: `notif-${Date.now()}`,
                              type: 'system',
                              message: `Add to course failed: ${err?.message || 'Unknown error'}`,
                              timestamp: new Date().toISOString(),
                              read: false,
                            },
                          });
                        } finally {
                          setAddLoading(false);
                        }
                      }}
                      disabled={addLoading}
                    >
                      {addLoading ? 'Adding…' : 'Add to course'}
                    </Button>

                    {searchOpen && (
                      <div className="mt-1">
                        <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 mb-1">
                          Results
                        </div>
                        {searchResults.length === 0 ? (
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">
                            {searchLoading ? 'Searching…' : 'No results'}
                          </div>
                        ) : (
                          <ul className="space-y-1.5">
                            {searchResults.map((r) => (
                              <li key={r.url} className="text-[11px]">
                                <a
                                  className="text-indigo-700 dark:text-indigo-300 hover:underline break-words"
                                  href={r.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {r.title || r.url}
                                </a>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {(r.source || '') +
                                    (r.description ? ` — ${r.description.slice(0, 120)}` : '')}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    <div className="text-[10px] text-gray-400 mt-1">
                      Links include source attribution.
                    </div>
                  </div>
                </div>
              )}
              {/* Persistence note */}
              <div
                id={persistNoteId}
                className="absolute bottom-4 left-4 max-w-[320px] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-card z-10 text-[11px] text-gray-700 dark:text-gray-200"
              >
                <div className="font-semibold">What persists</div>
                <ul className="mt-1 list-disc pl-4 space-y-0.5 text-gray-600 dark:text-gray-300">
                  <li>
                    Suggested topics (dashed) are <span className="font-semibold">saved</span> per
                    course.
                  </li>
                  <li>
                    Nodes you add locally (purple diamonds) are{' '}
                    <span className="font-semibold">not yet saved</span> unless your org has the
                    shared mindmap backend enabled.
                  </li>
                </ul>
              </div>

              {/* Presence */}
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-card z-10 text-xs flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-300">
                  Here now: <span className="font-semibold">{peers.length + 1}</span>
                </span>
                {peers.length === 0 ? (
                  <span className="text-gray-500 dark:text-gray-400">Just you</span>
                ) : (
                  <div className="flex items-center gap-1">
                    {peers.slice(0, 5).map((p) => (
                      <span
                        key={p.id}
                        title={p.name || 'Anonymous'}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
                        style={{ background: p.color || '#6366F1' }}
                      >
                        {(p.name || 'A').slice(0, 1).toUpperCase()}
                      </span>
                    ))}
                    {peers.length > 5 && (
                      <span className="text-gray-600 dark:text-gray-300 ml-1">
                        +{peers.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Mastery legend (Iter138): uses server mastery store (best-effort) */}
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 shadow-card z-10 text-xs space-y-1.5">
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Mastery Legend
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: '#9CA3AF' }} />{' '}
                  <span className="text-gray-600 dark:text-gray-300">New</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: '#F59E0B' }} />{' '}
                  <span className="text-gray-600 dark:text-gray-300">Learning</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: '#2563EB' }} />{' '}
                  <span className="text-gray-600 dark:text-gray-300">Solid</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: '#16A34A' }} />{' '}
                  <span className="text-gray-600 dark:text-gray-300">Mastered</span>
                </div>
                <div className="pt-1 text-[10px] text-gray-500 dark:text-gray-400">
                  ★ = review due
                </div>
              </div>
              {/* Zoom controls */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => {
                    if (networkRef.current) {
                      const scale = networkRef.current.getScale();
                      networkRef.current.moveTo({
                        scale: scale * 1.3,
                        animation: { duration: 300 },
                      });
                    }
                  }}
                  title="Zoom in"
                  className="shadow-card"
                >
                  <IconZoomIn size={18} className="text-gray-800 dark:text-gray-100" decorative />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => {
                    if (networkRef.current) {
                      const scale = networkRef.current.getScale();
                      networkRef.current.moveTo({
                        scale: scale * 0.7,
                        animation: { duration: 300 },
                      });
                    }
                  }}
                  title="Zoom out"
                  className="shadow-card"
                >
                  <IconZoomOut size={18} className="text-gray-800 dark:text-gray-100" decorative />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => {
                    if (networkRef.current) {
                      networkRef.current.fit({ animation: { duration: 500 } });
                    }
                  }}
                  title="Fit to screen"
                  className="shadow-card"
                >
                  <IconMaximize size={18} className="text-gray-800 dark:text-gray-100" decorative />
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Add Node Modal */}
      {showAddNode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowAddNode(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Add Custom Node
            </h3>
            <input
              type="text"
              value={newNodeLabel}
              onChange={(e) => setNewNodeLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomNode()}
              placeholder="Node label (e.g., Machine Learning)"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowAddNode(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={addCustomNode}
                disabled={!newNodeLabel.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
