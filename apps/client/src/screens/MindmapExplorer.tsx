import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, apiGet } from '../context/AppContext.js';

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
  const { state, dispatch } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const networkRef = useRef<null | { destroy: () => void; fit: (...args: unknown[]) => void; moveTo: (opts: Record<string, unknown>) => void; getScale: () => number }>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [customNodes, setCustomNodes] = useState<Array<{ id: string; label: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('learnflow-custom-nodes') || '[]'); } catch { return []; }
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

  // Fetch courses independently on mount — uses shared apiGet helper
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet('/courses');
        if (data.courses && data.courses.length > 0) {
          const fullCourses = await Promise.all(
            data.courses.map(async (c: { id: string }) => {
              try { return await apiGet(`/courses/${c.id}`); } catch { return null; }
            })
          );
          const valid = fullCourses.filter(Boolean);
          if (valid.length > 0) dispatch({ type: 'SET_COURSES', courses: valid });
        }
      } catch { /* ignore */ }
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
        // Fallback: vis-network not available
        setLoaded(false);
      });
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current || !Network || !DataSet) return;

    const NetworkCtor = Network as VisNetworkCtor;
    const DataSetCtor = DataSet as VisDataSetCtor;
    if (state.courses.length === 0) return;

    const nodes: Array<Record<string, unknown>> = [];
    const edges: Array<Record<string, unknown>> = [];
    let nodeId = 1;

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

      // Course node — color by mastery
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

        for (const lesson of mod.lessons) {
          const lessonNodeId = nodeId++;
          const isComplete = state.completedLessons.has(lesson.id);
          nodes.push({
            id: lessonNodeId,
            label: lesson.title.length > 35 ? lesson.title.slice(0, 35) + '…' : lesson.title,
            title: `${lesson.title}${isComplete ? ' ✓' : ''}`,
            shape: 'dot',
            color: {
              background: isComplete ? '#16A34A' : '#E5E7EB',
              border: isComplete ? '#15803D' : '#9CA3AF',
            },
            size: 10,
            _courseId: course.id,
            _lessonId: lesson.id,
          });
          edges.push({ from: modNodeId, to: lessonNodeId, color: { color: '#94A3B8' }, width: 2 });
        }
      }
    }

    const data: Record<string, unknown> = {
      nodes: new DataSetCtor(nodes),
      edges: new DataSetCtor(edges),
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
      interaction: { hover: true, tooltipDelay: 200 },
      nodes: { borderWidth: 2, shadow: { enabled: true, size: 4, x: 0, y: 2, color: 'rgba(0,0,0,0.1)' }, font: { size: 14, face: 'system-ui, sans-serif' } },
      edges: { smooth: { type: 'continuous' } },
    };

    const network = new NetworkCtor(containerRef.current, data, options);
    networkRef.current = network as any;

    // Auto-fit after stabilization
    network.on('stabilizationIterationsDone', () => {
      network.fit({ animation: { duration: 500, easingFunction: 'easeOutQuart' }, maxZoomLevel: 1.5 });
    });

    // Also fit once on stabilized (belt-and-suspenders)
    network.on('stabilized' as string, () => {
      network.fit({ animation: false, maxZoomLevel: 1.5 });
    });

    // Click handler — navigate to lesson
    network.on('click', (params: unknown) => {
      const p = params as { nodes?: unknown[] };
      if (Array.isArray(p.nodes) && p.nodes.length === 1) {
        const clickedId = p.nodes[0];
        const clickedNode = nodes.find((n) => n.id === clickedId);
        const courseId = clickedNode?._courseId as string | undefined;
        const lessonId = clickedNode?._lessonId as string | undefined;
        if (lessonId && courseId) {
          nav(`/courses/${courseId}/lessons/${lessonId}`);
        } else if (courseId) {
          nav(`/courses/${courseId}`);
        }
      }
    });

    return () => {
      network.destroy();
    };
    // Add custom nodes
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

  }, [loaded, state.courses, state.completedLessons, customNodes]);

  return (
    <section
      aria-label="Mindmap Explorer"
      data-screen="mindmap"
      className="min-h-screen bg-gray-50 dark:bg-bg-dark"
    >
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => nav('/dashboard')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">🗺️ Knowledge Map</h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <button
              onClick={() => setShowAddNode(true)}
              className="px-3 py-1.5 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent-dark transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              + Add Node
            </button>
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 inline-block border border-gray-400" aria-hidden="true" /> ○ Not started
            </span>
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <span className="w-3 h-3 rounded-full bg-warning inline-block border border-amber-500" aria-hidden="true" /> ◐ In progress
            </span>
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <span className="w-3 h-3 rounded-full bg-success inline-block border border-green-600" aria-hidden="true" /> ● Mastered
            </span>
          </div>
        </div>
      </header>
      <div className="px-0 sm:px-1 py-0">
        <div
          data-component="mindmap-preview"
          aria-label="Knowledge mindmap"
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          style={{ height: 'calc(100vh - 80px)', position: 'relative' }}
        >
          {state.courses.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <span className="text-5xl block mb-4">🗺️</span>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  Create a course to see your knowledge map
                </p>
                <button
                  onClick={() => nav('/dashboard')}
                  className="mt-4 px-5 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-dark transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          ) : !loaded ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              Loading graph...
            </div>
          ) : (
            <>
              <div ref={containerRef} className="w-full h-full" />
              {/* Zoom controls */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                <button
                  onClick={() => {
                    if (networkRef.current) {
                      const scale = networkRef.current.getScale();
                      networkRef.current.moveTo({ scale: scale * 1.3, animation: { duration: 300 } });
                    }
                  }}
                  className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex items-center justify-center text-lg font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Zoom in"
                >
                  +
                </button>
                <button
                  onClick={() => {
                    if (networkRef.current) {
                      const scale = networkRef.current.getScale();
                      networkRef.current.moveTo({ scale: scale * 0.7, animation: { duration: 300 } });
                    }
                  }}
                  className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex items-center justify-center text-lg font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Zoom out"
                >
                  −
                </button>
                <button
                  onClick={() => {
                    if (networkRef.current) {
                      networkRef.current.fit({ animation: { duration: 500 } });
                    }
                  }}
                  className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Fit to screen"
                >
                  ⊞
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Node Modal */}
      {showAddNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddNode(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Custom Node</h3>
            <input
              type="text"
              value={newNodeLabel}
              onChange={e => setNewNodeLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomNode()}
              placeholder="Node label (e.g., Machine Learning)"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowAddNode(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={addCustomNode} disabled={!newNodeLabel.trim()} className="flex-1 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-dark disabled:opacity-40">Add</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
