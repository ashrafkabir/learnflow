import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.js';

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
};

export function MindmapExplorer() {
  const nav = useNavigate();
  const { state } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const networkRef = useRef<null | { destroy: () => void }>(null);

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
      font: { color: '#fff', size: 16, bold: { color: '#fff' } },
      size: 35,
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
        label: course.title.length > 25 ? course.title.slice(0, 25) + '…' : course.title,
        title: `${course.title}\n${Math.round(coursePct * 100)}% complete`,
        shape: 'box',
        color: { background: courseColor, border: courseColor },
        font: { color: '#fff', size: 13 },
        borderWidth: 2,
        _courseId: course.id,
      });
      edges.push({ from: rootId, to: courseNodeId, color: { color: '#E5E7EB' }, width: 2 });

      for (const mod of course.modules) {
        const modNodeId = nodeId++;
        const modCompleted = mod.lessons.filter((l) => state.completedLessons.has(l.id)).length;
        const modPct = mod.lessons.length > 0 ? modCompleted / mod.lessons.length : 0;
        const modColor = modPct >= 1 ? '#16A34A' : modPct > 0 ? '#F59E0B' : '#D1D5DB';

        nodes.push({
          id: modNodeId,
          label: mod.title.length > 20 ? mod.title.slice(0, 20) + '…' : mod.title,
          title: `${mod.title}\n${modCompleted}/${mod.lessons.length} lessons`,
          shape: 'box',
          color: { background: modColor, border: modColor },
          font: { color: modPct > 0 ? '#fff' : '#374151', size: 11 },
          size: 20,
        });
        edges.push({ from: courseNodeId, to: modNodeId, color: { color: '#E5E7EB' } });

        for (const lesson of mod.lessons) {
          const lessonNodeId = nodeId++;
          const isComplete = state.completedLessons.has(lesson.id);
          nodes.push({
            id: lessonNodeId,
            label: lesson.title.length > 18 ? lesson.title.slice(0, 18) + '…' : lesson.title,
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
          edges.push({ from: modNodeId, to: lessonNodeId, color: { color: '#F3F4F6' } });
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
      interaction: { hover: true, tooltipDelay: 200 },
      nodes: { borderWidth: 2, shadow: true },
      edges: { smooth: { type: 'continuous' } },
    };

    const network = new NetworkCtor(containerRef.current, data, options);
    networkRef.current = network;

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
  }, [loaded, state.courses, state.completedLessons]);

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
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">🗺️ Knowledge Map</h1>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" /> Not started
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-warning inline-block" /> In progress
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-success inline-block" /> Mastered
            </span>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div
          data-component="mindmap-preview"
          aria-label="Knowledge mindmap"
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          style={{ height: '70vh' }}
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
            <div className="flex items-center justify-center h-full text-gray-400">
              Loading graph...
            </div>
          ) : (
            <div ref={containerRef} className="w-full h-full" />
          )}
        </div>
      </div>
    </section>
  );
}
