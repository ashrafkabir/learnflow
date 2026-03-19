import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, apiGet } from '../context/AppContext.js';
import { Button } from '../components/Button.js';
import { IconMap, IconMaximize, IconZoomIn, IconZoomOut } from '../components/icons/index.js';

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
  }>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ url: string; title: string; description?: string; source?: string }>
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const mindmapRef = useRef<HTMLDivElement | null>(null);
  const [customNodes, setCustomNodes] = useState<Array<{ id: string; label: string }>>(() => {
    try {
      return JSON.parse(localStorage.getItem('learnflow-custom-nodes') || '[]');
    } catch {
      return [];
    }
  });

  const addCustomNode = () => {
    if (!newNodeLabel.trim()) return;
    const node = { id: `custom-${Date.now()}`, label: newNodeLabel.trim() };
    const updated = [...customNodes, node];
    setCustomNodes(updated);
    localStorage.setItem('learnflow-custom-nodes', JSON.stringify(updated));
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
          if (valid.length > 0) dispatch({ type: 'SET_COURSES', courses: valid });
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

      // Color by mastery level:
      // - not started → gray (#9CA3AF)
      // - in progress → amber (#F59E0B)
      // - mastered → green (#16A34A)
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
          const lessonBg = isComplete ? '#16A34A' : isInProgress ? '#F59E0B' : '#E5E7EB';
          const lessonBorder = isComplete ? '#15803D' : isInProgress ? '#D97706' : '#9CA3AF';
          const statusLabel = isComplete ? ' (complete)' : isInProgress ? ' (in progress)' : '';
          lessonIdToNodeId.set(lesson.id, lessonNodeId);
          nodes.push({
            id: lessonNodeId,
            label: lesson.title.length > 35 ? lesson.title.slice(0, 35) + '…' : lesson.title,
            title: `${lesson.title}${statusLabel}`,
            shape: 'dot',
            color: {
              background: lessonBg,
              border: lessonBorder,
            },
            size: 10,
            _courseId: course.id,
            _lessonId: lesson.id,
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

          setSuggestedAction({ label, topicId, reason });
          setSearchOpen(false);
          setSearchResults([]);
          return;
        }

        if (lessonId && courseId) {
          nav(`/courses/${courseId}/lessons/${lessonId}`);
        } else if (courseId) {
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
                className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 inline-block border border-gray-400"
                aria-hidden="true"
              />{' '}
              Not started
            </span>
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <span
                className="w-3 h-3 rounded-full bg-warning inline-block border border-amber-500"
                aria-hidden="true"
              />{' '}
              In progress
            </span>
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <span
                className="w-3 h-3 rounded-full bg-success inline-block border border-green-600"
                aria-hidden="true"
              />{' '}
              Mastered
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
          {state.courses.length === 0 ? (
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

                          // Remove suggestion from local suggestions for that course
                          const cid = String(updatedCourse.id || courseId || 'global');
                          const current = state.mindmapSuggestions?.[cid] || [];
                          const next = current.filter(
                            (s) =>
                              s.id !== suggestedAction.topicId && s.label !== suggestedAction.label,
                          );
                          dispatch({
                            type: 'SET_MINDMAP_SUGGESTIONS',
                            courseId: cid,
                            suggestions: next,
                          });

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
              {/* Mastery legend */}
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 shadow-card z-10 text-xs space-y-1.5">
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Mastery Level Legend
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: '#9CA3AF' }} />{' '}
                  <span className="text-gray-600 dark:text-gray-300">Not started</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: '#F59E0B' }} />{' '}
                  <span className="text-gray-600 dark:text-gray-300">In progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: '#16A34A' }} />{' '}
                  <span className="text-gray-600 dark:text-gray-300">Mastered</span>
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
