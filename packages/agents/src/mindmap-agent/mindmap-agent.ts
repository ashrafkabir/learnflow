/**
 * Mindmap Agent — manages knowledge graphs with CRDT-based collaborative editing.
 */

import type { AgentInterface, AgentResponse, StudentContextObject } from '@learnflow/core';

export interface MindmapNode {
  id: string;
  label: string;
  mastery: 'not_started' | 'in_progress' | 'mastered';
  parent: string | null;
}

export interface MindmapEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
}

export interface Mindmap {
  id: string;
  userId: string;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  lastUpdated: Date;
}

// Simplified CRDT operations for collaborative editing
export interface CrdtOperation {
  type: 'add_node' | 'update_node' | 'delete_node' | 'add_edge' | 'delete_edge';
  timestamp: number;
  userId: string;
  payload: Record<string, unknown>;
}

export class MindmapAgent implements AgentInterface {
  name = 'mindmap_agent';
  capabilities = ['update_mindmap', 'visualize', 'extend_graph'];

  async initialize(): Promise<void> {}

  async process(
    context: StudentContextObject,
    task: { type: string; params: Record<string, unknown> },
  ): Promise<AgentResponse> {
    const currentMap =
      (task.params.currentMap as Mindmap) || this.createEmptyMindmap(context.userId);
    const newConcepts = (task.params.newConcepts as string[]) || [];

    if (task.type === 'extend_graph' && newConcepts.length > 0) {
      const updatedMap = this.extendMindmap(currentMap, newConcepts);
      return {
        agentName: this.name,
        status: 'success',
        data: {
          text: `Extended knowledge graph with ${newConcepts.length} new concepts.`,
          mindmap: updatedMap,
          nodesAdded: newConcepts.length,
        },
        tokensUsed: 75,
      };
    }

    // Export as SVG
    if (task.type === 'export_svg') {
      const svg = this.exportToSvg(currentMap);
      return {
        agentName: this.name,
        status: 'success',
        data: { text: 'Mindmap exported as SVG.', svg },
        tokensUsed: 50,
      };
    }

    return {
      agentName: this.name,
      status: 'success',
      data: {
        text: `Your knowledge graph has ${currentMap.nodes.length} concepts.`,
        mindmap: currentMap,
      },
      tokensUsed: 50,
    };
  }

  async cleanup(): Promise<void> {}

  createEmptyMindmap(userId: string): Mindmap {
    return {
      id: `mindmap-${userId}`,
      userId,
      nodes: [],
      edges: [],
      lastUpdated: new Date(),
    };
  }

  createNode(id: string, label: string, parent: string | null = null): MindmapNode {
    return {
      id,
      label,
      mastery: 'not_started',
      parent,
    };
  }

  createEdge(source: string, target: string, relationship: string = 'related_to'): MindmapEdge {
    return {
      id: `edge-${source}-${target}`,
      source,
      target,
      relationship,
    };
  }

  extendMindmap(map: Mindmap, newConcepts: string[]): Mindmap {
    const updated: Mindmap = {
      ...map,
      nodes: [...map.nodes],
      edges: [...map.edges],
      lastUpdated: new Date(),
    };

    for (let i = 0; i < newConcepts.length; i++) {
      const nodeId = `node-${Date.now()}-${i}`;
      const node = this.createNode(nodeId, newConcepts[i]);
      updated.nodes.push(node);

      // Link to previous node or first existing node
      if (i > 0) {
        const prevId = updated.nodes[updated.nodes.length - 2].id;
        updated.edges.push(this.createEdge(prevId, nodeId, 'leads_to'));
      } else if (updated.nodes.length > 1) {
        const firstId = updated.nodes[0].id;
        updated.edges.push(this.createEdge(firstId, nodeId, 'related_to'));
      }
    }

    return updated;
  }

  exportToSvg(map: Mindmap): string {
    const width = 800;
    const height = 600;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
    svg += `<rect width="100%" height="100%" fill="#f8f9fa"/>`;

    // Simple node positioning
    const nodes = map.nodes;
    const positions: Record<string, { x: number; y: number }> = {};

    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1);
      const r = 200;
      positions[node.id] = {
        x: width / 2 + r * Math.cos(angle),
        y: height / 2 + r * Math.sin(angle),
      };
    });

    // Draw edges
    for (const edge of map.edges) {
      const from = positions[edge.source];
      const to = positions[edge.target];
      if (from && to) {
        svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#999" stroke-width="2"/>`;
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const pos = positions[node.id];
      const color =
        node.mastery === 'mastered'
          ? '#22c55e'
          : node.mastery === 'in_progress'
            ? '#f59e0b'
            : '#e5e7eb';
      svg += `<circle cx="${pos.x}" cy="${pos.y}" r="30" fill="${color}" stroke="#333"/>`;
      svg += `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="middle" font-size="12">${node.label.slice(0, 15)}</text>`;
    }

    svg += `</svg>`;
    return svg;
  }

  // CRDT merge: apply operations and converge
  applyCrdtOperations(map: Mindmap, operations: CrdtOperation[]): Mindmap {
    const result = { ...map, nodes: [...map.nodes], edges: [...map.edges] };

    // Sort by timestamp for causal ordering
    const sorted = operations.sort((a, b) => a.timestamp - b.timestamp);

    for (const op of sorted) {
      switch (op.type) {
        case 'add_node': {
          const node = op.payload as unknown as MindmapNode;
          if (!result.nodes.find((n) => n.id === node.id)) {
            result.nodes.push(node);
          }
          break;
        }
        case 'update_node': {
          const idx = result.nodes.findIndex((n) => n.id === op.payload.id);
          if (idx >= 0) {
            result.nodes[idx] = { ...result.nodes[idx], ...op.payload } as MindmapNode;
          }
          break;
        }
        case 'delete_node': {
          result.nodes = result.nodes.filter((n) => n.id !== op.payload.id);
          result.edges = result.edges.filter(
            (e) => e.source !== op.payload.id && e.target !== op.payload.id,
          );
          break;
        }
        case 'add_edge': {
          const edge = op.payload as unknown as MindmapEdge;
          if (!result.edges.find((e) => e.id === edge.id)) {
            result.edges.push(edge);
          }
          break;
        }
        case 'delete_edge': {
          result.edges = result.edges.filter((e) => e.id !== op.payload.id);
          break;
        }
      }
    }

    result.lastUpdated = new Date();
    return result;
  }
}
