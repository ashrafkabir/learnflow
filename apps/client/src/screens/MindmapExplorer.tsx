import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface MindmapNode {
  id: string;
  label: string;
  mastery: number;
  children: MindmapNode[];
}

const MOCK_GRAPH: MindmapNode = {
  id: 'root',
  label: 'My Knowledge',
  mastery: 0.6,
  children: [
    {
      id: 'ml',
      label: 'Machine Learning',
      mastery: 0.7,
      children: [
        { id: 'nn', label: 'Neural Networks', mastery: 0.5, children: [] },
        { id: 'dl', label: 'Deep Learning', mastery: 0.3, children: [] },
      ],
    },
    {
      id: 'rust',
      label: 'Rust',
      mastery: 0.4,
      children: [
        { id: 'own', label: 'Ownership', mastery: 0.6, children: [] },
        { id: 'traits', label: 'Traits', mastery: 0.2, children: [] },
      ],
    },
    {
      id: 'qc',
      label: 'Quantum Computing',
      mastery: 0.2,
      children: [{ id: 'qubits', label: 'Qubits', mastery: 0.3, children: [] }],
    },
  ],
};

function NodeComponent({
  node,
  depth,
  onSelect,
}: {
  node: MindmapNode;
  depth: number;
  onSelect: (n: MindmapNode) => void;
}) {
  const color = node.mastery > 0.6 ? '#10B981' : node.mastery > 0.3 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ marginLeft: depth * 24 }}>
      <button
        onClick={() => onSelect(node)}
        aria-label={`${node.label} - ${Math.round(node.mastery * 100)}% mastery`}
        data-node-id={node.id}
        role="treeitem"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          margin: '2px 0',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          background: '#fff',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span
          style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }}
          aria-label="Mastery indicator"
        />
        <span style={{ flex: 1, fontSize: 14 }}>{node.label}</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{Math.round(node.mastery * 100)}%</span>
      </button>
      {node.children.map((c) => (
        <NodeComponent key={c.id} node={c} depth={depth + 1} onSelect={onSelect} />
      ))}
    </div>
  );
}

/** S08-A07: Mindmap explorer with interactive graph and mastery indicators */
export function MindmapExplorer() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<MindmapNode | null>(null);

  return (
    <section aria-label="Mindmap Explorer" data-screen="mindmap-explorer" style={{ padding: 24 }}>
      <button onClick={() => nav('/dashboard')} style={{ marginBottom: 16 }}>
        ← Back
      </button>
      <h1 style={{ fontSize: '24px', marginBottom: 16 }}>Knowledge Map</h1>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div
          data-component="mindmap-graph"
          role="tree"
          aria-label="Knowledge graph"
          style={{ flex: 1, minWidth: 300 }}
        >
          <NodeComponent node={MOCK_GRAPH} depth={0} onSelect={setSelected} />
        </div>
        {selected && (
          <div
            data-component="node-detail"
            aria-label={`Details for ${selected.label}`}
            style={{ width: 280, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}
          >
            <h2 style={{ fontSize: '20px' }}>{selected.label}</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: 8 }}>
              Mastery: {Math.round(selected.mastery * 100)}%
            </p>
            <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, marginTop: 8 }}>
              <div
                style={{
                  width: `${selected.mastery * 100}%`,
                  height: '100%',
                  background: '#6366F1',
                  borderRadius: 4,
                }}
              />
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: 8 }}>
              {selected.children.length} subtopics
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
