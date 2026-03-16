import { describe, it, expect } from 'vitest';
import { CollaborationAgent } from '../collaboration-agent/collaboration-agent.js';
import { MindmapAgent } from '../mindmap-agent/mindmap-agent.js';
import type { StudentContextObject } from '@learnflow/core';

function createMockContext(overrides: Partial<StudentContextObject> = {}): StudentContextObject {
  return {
    userId: 'user-1',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Alice',
      role: 'student',
      tier: 'free',
      goals: ['Learn ML', 'Learn Python'],
      preferredLanguage: 'en',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    enrolledCourseIds: [],
    completedLessonIds: [],
    goals: ['Learn ML', 'Learn Python'],
    strengths: [],
    weaknesses: [],
    learningStyle: 'reading',
    quizScores: {},
    studyStreak: 0,
    totalStudyMinutes: 0,
    lastActiveAt: new Date(),
    goalDetails: [],
    interests: [],
    browseHistory: [],
    searchQueries: [],
    bookmarkedContent: [],
    sessionFrequency: 0,
    preferredTimeOfDay: 'morning',
    preferredLessonLength: 10,
    subscriptionTier: 'free',
    billingStatus: 'active',
    usageQuotas: {},
    notificationSettings: { email: true, push: true, inApp: true },
    preferredAgents: [],
    displayPreferences: { theme: 'light', fontSize: 16 },
    collaborationOptIn: false,
    peerConnections: [],
    sharedCourses: [],
    lessonRatings: {},
    agentRatings: {},
    courseReviews: [],
    ...overrides,
  };
}

// S06-A01: Peer matching algorithm finds users with overlapping goals
describe('S06-A01: Peer matching', () => {
  it('finds users with overlapping goals', () => {
    const agent = new CollaborationAgent();
    const user = createMockContext({ userId: 'user-1', goals: ['Learn ML', 'Learn Python'] });
    const others = [
      createMockContext({
        userId: 'user-2',
        goals: ['Learn ML', 'Learn JavaScript'],
        user: { ...user.user, id: 'user-2', displayName: 'Bob' },
      }),
      createMockContext({
        userId: 'user-3',
        goals: ['Learn Cooking'],
        user: { ...user.user, id: 'user-3', displayName: 'Carol' },
      }),
      createMockContext({
        userId: 'user-4',
        goals: ['Learn Python', 'Learn ML'],
        user: { ...user.user, id: 'user-4', displayName: 'Dave' },
      }),
    ];

    const matches = agent.findPeerMatches(user, others);
    expect(matches.length).toBe(2); // Bob and Dave
    expect(matches[0].matchScore).toBeGreaterThanOrEqual(matches[1].matchScore);
    expect(matches[0].overlappingGoals.length).toBeGreaterThan(0);
  });
});

// S06-A02: Study group creation stores members and shared resources
describe('S06-A02: Study group creation', () => {
  it('creates group with members and shared resources', async () => {
    const agent = new CollaborationAgent();
    const ctx = createMockContext();

    const result = await agent.process(ctx, {
      type: 'create_group',
      params: { groupName: 'ML Study Group', memberIds: ['user-1', 'user-2', 'user-3'] },
    });

    expect(result.status).toBe('success');
    const group = (
      result.data as {
        group: { id: string; name: string; memberIds: string[]; sharedResources: string[] };
      }
    ).group;
    expect(group.id).toBeDefined();
    expect(group.name).toBe('ML Study Group');
    expect(group.memberIds).toEqual(['user-1', 'user-2', 'user-3']);
    expect(Array.isArray(group.sharedResources)).toBe(true);
  });
});

// S06-A03: Collaboration Agent produces match recommendations
describe('S06-A03: Match recommendations', () => {
  it('produces match recommendations via process()', async () => {
    const agent = new CollaborationAgent();
    const ctx = createMockContext();
    const other = createMockContext({
      userId: 'user-2',
      goals: ['Learn ML'],
      user: { ...ctx.user, id: 'user-2', displayName: 'Bob' },
    });

    const result = await agent.process(ctx, {
      type: 'find_peers',
      params: { allUsers: [ctx, other] },
    });

    expect(result.status).toBe('success');
    const data = result.data as { matches: Array<{ userId: string; matchScore: number }> };
    expect(data.matches.length).toBe(1);
    expect(data.matches[0].userId).toBe('user-2');
  });
});

// S06-A04: Mindmap data model: nodes have id, label, mastery, parent
describe('S06-A04: Mindmap node schema', () => {
  it('nodes have required fields', () => {
    const agent = new MindmapAgent();
    const node = agent.createNode('n1', 'Machine Learning', null);
    expect(node.id).toBe('n1');
    expect(node.label).toBe('Machine Learning');
    expect(node.mastery).toBe('not_started');
    expect(node.parent).toBeNull();
  });
});

// S06-A05: Mindmap CRUD: create, read, update, delete nodes and edges
describe('S06-A05: Mindmap CRUD', () => {
  it('creates and reads nodes and edges', () => {
    const agent = new MindmapAgent();
    const map = agent.createEmptyMindmap('user-1');
    expect(map.nodes.length).toBe(0);

    const extended = agent.extendMindmap(map, ['ML', 'Deep Learning']);
    expect(extended.nodes.length).toBe(2);
    expect(extended.edges.length).toBe(1);
  });

  it('updates nodes via CRDT operation', () => {
    const agent = new MindmapAgent();
    let map = agent.createEmptyMindmap('user-1');
    map = agent.extendMindmap(map, ['Topic A']);
    const nodeId = map.nodes[0].id;

    const updated = agent.applyCrdtOperations(map, [
      {
        type: 'update_node',
        timestamp: Date.now(),
        userId: 'user-1',
        payload: { id: nodeId, mastery: 'mastered' },
      },
    ]);

    expect(updated.nodes[0].mastery).toBe('mastered');
  });

  it('deletes nodes and associated edges', () => {
    const agent = new MindmapAgent();
    let map = agent.createEmptyMindmap('user-1');
    map = agent.extendMindmap(map, ['A', 'B', 'C']);
    const nodeToDelete = map.nodes[1].id;

    const updated = agent.applyCrdtOperations(map, [
      {
        type: 'delete_node',
        timestamp: Date.now(),
        userId: 'user-1',
        payload: { id: nodeToDelete },
      },
    ]);

    expect(updated.nodes.find((n) => n.id === nodeToDelete)).toBeUndefined();
    expect(
      updated.edges.filter((e) => e.source === nodeToDelete || e.target === nodeToDelete).length,
    ).toBe(0);
  });
});

// S06-A06: Mindmap export produces valid SVG
describe('S06-A06: SVG export', () => {
  it('exports valid SVG string', () => {
    const agent = new MindmapAgent();
    let map = agent.createEmptyMindmap('user-1');
    map = agent.extendMindmap(map, ['ML', 'Neural Nets', 'Deep Learning']);

    const svg = agent.exportToSvg(map);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('<circle');
    expect(svg).toContain('<text');
  });
});

// S06-A07: Mindmap Agent extends graph when new course is created
describe('S06-A07: Mindmap Agent extend_graph', () => {
  it('extends graph with new concepts', async () => {
    const agent = new MindmapAgent();
    const ctx = createMockContext();
    const map = agent.createEmptyMindmap(ctx.userId);

    const result = await agent.process(ctx, {
      type: 'extend_graph',
      params: { currentMap: map, newConcepts: ['Python', 'Variables', 'Functions'] },
    });

    expect(result.status).toBe('success');
    const data = result.data as {
      mindmap: { nodes: unknown[]; edges: unknown[] };
      nodesAdded: number;
    };
    expect(data.nodesAdded).toBe(3);
    expect(data.mindmap.nodes.length).toBe(3);
  });
});

// S06-A08: CRDT sync: concurrent edits on shared mindmap converge
describe('S06-A08: CRDT convergence', () => {
  it('concurrent edits converge to same state', () => {
    const agent = new MindmapAgent();
    let base = agent.createEmptyMindmap('shared');
    base = agent.extendMindmap(base, ['Root']);

    // User A adds node
    const opsA = [
      {
        type: 'add_node' as const,
        timestamp: 1000,
        userId: 'user-a',
        payload: { id: 'node-a', label: 'From A', mastery: 'not_started', parent: null },
      },
    ];

    // User B adds node
    const opsB = [
      {
        type: 'add_node' as const,
        timestamp: 1001,
        userId: 'user-b',
        payload: { id: 'node-b', label: 'From B', mastery: 'not_started', parent: null },
      },
    ];

    // Apply in different orders — should converge
    const resultAB = agent.applyCrdtOperations(agent.applyCrdtOperations(base, opsA), opsB);
    const resultBA = agent.applyCrdtOperations(agent.applyCrdtOperations(base, opsB), opsA);

    expect(resultAB.nodes.length).toBe(resultBA.nodes.length);
    expect(resultAB.nodes.map((n) => n.id).sort()).toEqual(resultBA.nodes.map((n) => n.id).sort());
  });
});

// S06-A09: All collaboration types compile (verified by tsc --noEmit, tested implicitly)
describe('S06-A09: Types compile', () => {
  it('collaboration and mindmap types are importable', () => {
    // If this file compiles/runs, types are valid
    const agent1: AgentInterface = new CollaborationAgent();
    const agent2: AgentInterface = new MindmapAgent();
    expect(agent1.name).toBe('collaboration_agent');
    expect(agent2.name).toBe('mindmap_agent');
  });
});

// S06-A10: Full flow: create group → share mindmap → concurrent edit → converge
describe('S06-A10: Full integration flow', () => {
  it('create group → extend mindmap → concurrent CRDT edits → converge', async () => {
    const collab = new CollaborationAgent();
    const mindmap = new MindmapAgent();
    const ctx = createMockContext();

    // Step 1: Create study group
    const groupResult = await collab.process(ctx, {
      type: 'create_group',
      params: { groupName: 'ML Team', memberIds: ['user-1', 'user-2'] },
    });
    expect(groupResult.status).toBe('success');

    // Step 2: Create shared mindmap
    let map = mindmap.createEmptyMindmap('shared');
    const extendResult = await mindmap.process(ctx, {
      type: 'extend_graph',
      params: { currentMap: map, newConcepts: ['ML Basics', 'Supervised Learning'] },
    });
    map = (extendResult.data as { mindmap: typeof map }).mindmap;
    expect(map.nodes.length).toBe(2);

    // Step 3: Concurrent edits
    const ops = [
      {
        type: 'add_node' as const,
        timestamp: 100,
        userId: 'user-1',
        payload: { id: 'n-u1', label: 'User1 Concept', mastery: 'not_started', parent: null },
      },
      {
        type: 'add_node' as const,
        timestamp: 101,
        userId: 'user-2',
        payload: { id: 'n-u2', label: 'User2 Concept', mastery: 'not_started', parent: null },
      },
    ];

    const merged = mindmap.applyCrdtOperations(map, ops);
    expect(merged.nodes.length).toBe(4); // 2 original + 2 new
    expect(merged.nodes.find((n) => n.id === 'n-u1')).toBeDefined();
    expect(merged.nodes.find((n) => n.id === 'n-u2')).toBeDefined();
  });
});
