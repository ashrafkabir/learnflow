import { describe, it, expect } from 'vitest';
import { Orchestrator } from '../orchestrator/orchestrator.js';
import { AgentRegistry } from '../agents/registry.js';
import { DagPlanner, DagTask } from '../orchestrator/dag-planner.js';
import { RateLimiter } from '../orchestrator/rate-limiter.js';
import { StudentContextLoader } from '../context/student-context.js';
import type { StudentContextObject, ContextStore } from '../context/student-context.js';
import type { AgentInterface } from '../agents/types.js';
import { routeIntent } from '../orchestrator/intent-router.js';
import { aggregateResponses } from '../orchestrator/response-aggregator.js';
import { updateContextFromEvent } from '../orchestrator/behavioral-tracker.js';
import { ORCHESTRATOR_SYSTEM_PROMPT } from '../orchestrator/system-prompt.js';

// Mock agent factory
function createMockAgent(
  name: string,
  capabilities: string[],
  responseData: unknown = 'mock response',
): AgentInterface {
  return {
    name,
    capabilities,
    initialize: async () => {},
    process: async (_ctx, _task) => ({
      agentName: name,
      status: 'success' as const,
      data: responseData,
      tokensUsed: 100,
    }),
    cleanup: async () => {},
  };
}

function createMockContext(overrides: Partial<StudentContextObject> = {}): StudentContextObject {
  return {
    userId: 'user-1',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'student',
      tier: 'free',
      goals: ['Learn Python'],
      preferredLanguage: 'en',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    enrolledCourseIds: [],
    completedLessonIds: [],
    goals: ['Learn Python'],
    strengths: [],
    weaknesses: [],
    learningStyle: 'reading',
    quizScores: {},
    studyStreak: 5,
    totalStudyMinutes: 120,
    lastActiveAt: new Date(),
    goalDetails: [{ goal: 'Learn Python', priority: 'high' }],
    interests: ['programming'],
    browseHistory: [],
    searchQueries: [],
    bookmarkedContent: [],
    sessionFrequency: 3,
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

// S03-A01: StudentContextObject type matches all fields from spec Section 9.1
describe('S03-A01: StudentContextObject type', () => {
  it('has all spec Section 9.1 fields', () => {
    const ctx = createMockContext();
    // Goals
    expect(ctx.goals).toBeDefined();
    expect(ctx.goalDetails).toBeDefined();
    // Interests
    expect(ctx.interests).toBeDefined();
    expect(ctx.browseHistory).toBeDefined();
    expect(ctx.searchQueries).toBeDefined();
    expect(ctx.bookmarkedContent).toBeDefined();
    // Progress
    expect(ctx.completedLessonIds).toBeDefined();
    expect(ctx.quizScores).toBeDefined();
    expect(ctx.totalStudyMinutes).toBeDefined();
    // Activity
    expect(ctx.sessionFrequency).toBeDefined();
    expect(ctx.preferredTimeOfDay).toBeDefined();
    expect(ctx.preferredLessonLength).toBeDefined();
    // Subscription
    expect(ctx.subscriptionTier).toBeDefined();
    expect(ctx.billingStatus).toBeDefined();
    expect(ctx.usageQuotas).toBeDefined();
    // Preferences
    expect(ctx.notificationSettings).toBeDefined();
    expect(ctx.preferredAgents).toBeDefined();
    expect(ctx.displayPreferences).toBeDefined();
    // Social
    expect(ctx.collaborationOptIn).toBeDefined();
    expect(ctx.peerConnections).toBeDefined();
    expect(ctx.sharedCourses).toBeDefined();
    // Feedback
    expect(ctx.lessonRatings).toBeDefined();
    expect(ctx.agentRatings).toBeDefined();
    expect(ctx.courseReviews).toBeDefined();
  });
});

// S03-A02: Context loader assembles SCO from DB correctly
describe('S03-A02: Context loader', () => {
  it('assembles SCO from mock DB', async () => {
    const mockStore: ContextStore = {
      getUser: async () => ({
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test',
        role: 'student',
        tier: 'free',
        goals: ['Learn Python'],
        preferredLanguage: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      getEnrolledCourseIds: async () => ['course-1'],
      getCompletedLessonIds: async () => ['lesson-1', 'lesson-2'],
      getQuizScores: async () => ({ quiz1: 0.85 }),
      getStudyStreak: async () => 5,
      getTotalStudyMinutes: async () => 120,
      getLastActiveAt: async () => new Date(),
    };

    const loader = new StudentContextLoader(mockStore);
    const ctx = await loader.load('user-1');

    expect(ctx).not.toBeNull();
    expect(ctx!.userId).toBe('user-1');
    expect(ctx!.enrolledCourseIds).toEqual(['course-1']);
    expect(ctx!.completedLessonIds).toEqual(['lesson-1', 'lesson-2']);
    expect(ctx!.quizScores).toEqual({ quiz1: 0.85 });
    expect(ctx!.studyStreak).toBe(5);
    expect(ctx!.goals).toEqual(['Learn Python']);
  });

  it('returns null for non-existent user', async () => {
    const mockStore: ContextStore = {
      getUser: async () => null,
      getEnrolledCourseIds: async () => [],
      getCompletedLessonIds: async () => [],
      getQuizScores: async () => ({}),
      getStudyStreak: async () => 0,
      getTotalStudyMinutes: async () => 0,
      getLastActiveAt: async () => new Date(),
    };

    const loader = new StudentContextLoader(mockStore);
    const ctx = await loader.load('nonexistent');
    expect(ctx).toBeNull();
  });
});

// S03-A03: Agent registry returns correct agent for capability query
describe('S03-A03: Agent registry capability lookup', () => {
  it('returns CourseBuilderAgent for build_course capability', () => {
    const registry = new AgentRegistry();
    const agent = createMockAgent('course_builder', ['build_course', 'update_syllabus']);
    registry.register(agent);

    const found = registry.findByCapability('build_course');
    expect(found).toBeDefined();
    expect(found!.name).toBe('course_builder');
  });

  it('returns undefined for unknown capability', () => {
    const registry = new AgentRegistry();
    expect(registry.findByCapability('fly_to_mars')).toBeUndefined();
  });
});

// S03-A04: DAG planner parallelizes independent agent calls
describe('S03-A04: DAG parallelization', () => {
  it('runs independent tasks in parallel', async () => {
    const planner = new DagPlanner();
    const executionOrder: string[] = [];

    const tasks: DagTask[] = [
      {
        id: 'a',
        agentName: 'agent_a',
        dependsOn: [],
        execute: async () => {
          executionOrder.push('a_start');
          await new Promise((r) => setTimeout(r, 50));
          executionOrder.push('a_end');
          return 'result_a';
        },
      },
      {
        id: 'b',
        agentName: 'agent_b',
        dependsOn: [],
        execute: async () => {
          executionOrder.push('b_start');
          await new Promise((r) => setTimeout(r, 50));
          executionOrder.push('b_end');
          return 'result_b';
        },
      },
    ];

    const results = await planner.execute(tasks);
    expect(results).toHaveLength(2);

    // Both should have started before either ended (parallel)
    const aStart = executionOrder.indexOf('a_start');
    const bStart = executionOrder.indexOf('b_start');
    const aEnd = executionOrder.indexOf('a_end');
    const bEnd = executionOrder.indexOf('b_end');

    // Both started before both ended
    expect(Math.max(aStart, bStart)).toBeLessThan(Math.min(aEnd, bEnd));
  });
});

// S03-A05: DAG planner serializes dependent agent calls
describe('S03-A05: DAG serialization', () => {
  it('runs dependent tasks sequentially (B before A)', async () => {
    const planner = new DagPlanner();
    const executionOrder: string[] = [];

    const tasks: DagTask[] = [
      {
        id: 'a',
        agentName: 'agent_a',
        dependsOn: ['b'],
        execute: async () => {
          executionOrder.push('a');
          return 'result_a';
        },
      },
      {
        id: 'b',
        agentName: 'agent_b',
        dependsOn: [],
        execute: async () => {
          executionOrder.push('b');
          return 'result_b';
        },
      },
    ];

    await planner.execute(tasks);
    expect(executionOrder).toEqual(['b', 'a']);
  });
});

// S03-A06: Orchestrator routes "I want to learn Python" to course_builder
describe('S03-A06: Route learn intent to course_builder', () => {
  it('routes to course_builder', () => {
    const intent = routeIntent('I want to learn Python');
    expect(intent).not.toBeNull();
    expect(intent!.agentName).toBe('course_builder');
  });
});

// S03-A07: Orchestrator routes "quiz me" to exam_agent
describe('S03-A07: Route quiz intent to exam_agent', () => {
  it('routes to exam_agent', () => {
    const intent = routeIntent('quiz me on what we covered');
    expect(intent).not.toBeNull();
    expect(intent!.agentName).toBe('exam_agent');
  });
});

// S03-A08: Orchestrator routes "take notes" to notes_agent
describe('S03-A08: Route notes intent to notes_agent', () => {
  it('routes to notes_agent', () => {
    const intent = routeIntent('take notes on this lesson');
    expect(intent).not.toBeNull();
    expect(intent!.agentName).toBe('notes_agent');
  });
});

// S03-A09: Orchestrator handles unknown intent gracefully
describe('S03-A09: Unknown intent handling', () => {
  it('returns null for gibberish', () => {
    const intent = routeIntent('asdfghjkl xyz123');
    expect(intent).toBeNull();
  });

  it('orchestrator returns helpful message for unknown intent', async () => {
    const registry = new AgentRegistry();
    const orchestrator = new Orchestrator(registry);
    const ctx = createMockContext();

    const response = await orchestrator.processMessage('asdfghjkl xyz123', ctx);
    expect(response.text).toContain('not sure');
    expect(response.suggestedActions.length).toBeGreaterThan(0);
  });
});

// S03-A10: Response aggregator merges multi-agent outputs
describe('S03-A10: Response aggregator', () => {
  it('merges multiple agent responses', () => {
    const result = aggregateResponses([
      {
        agentName: 'course_builder',
        status: 'success',
        data: 'Here is your course outline.',
        tokensUsed: 200,
      },
      {
        agentName: 'notes_agent',
        status: 'success',
        data: 'Notes have been created.',
        tokensUsed: 100,
      },
    ]);

    expect(result.text).toContain('course outline');
    expect(result.text).toContain('Notes have been created');
    expect(result.totalTokensUsed).toBe(300);
    // Always return 3–4 suggested actions
    expect(result.suggestedActions.length).toBeGreaterThanOrEqual(3);
    expect(result.suggestedActions.length).toBeLessThanOrEqual(4);
  });

  it('handles errors gracefully', () => {
    const result = aggregateResponses([
      { agentName: 'course_builder', status: 'error', data: null },
    ]);

    expect(result.text).toContain('temporarily unavailable');
    expect(result.suggestedActions.length).toBeGreaterThanOrEqual(3);
    expect(result.suggestedActions.length).toBeLessThanOrEqual(4);
  });
});

// S03-A11: Behavioral tracker updates SCO after quiz completion
describe('S03-A11: Behavioral tracker updates SCO', () => {
  it('updates quizScores and strengths after quiz', () => {
    const ctx = createMockContext();
    const updated = updateContextFromEvent(ctx, {
      type: 'quiz_complete',
      data: { quizId: 'quiz-1', score: 0.95, topic: 'Python Basics' },
      timestamp: new Date(),
    });

    expect(updated.quizScores['quiz-1']).toBe(0.95);
    expect(updated.strengths).toContain('Python Basics');
  });

  it('updates weaknesses for low quiz scores', () => {
    const ctx = createMockContext();
    const updated = updateContextFromEvent(ctx, {
      type: 'quiz_complete',
      data: { quizId: 'quiz-2', score: 0.4, topic: 'Advanced Algorithms' },
      timestamp: new Date(),
    });

    expect(updated.weaknesses).toContain('Advanced Algorithms');
  });
});

// S03-A12: Rate limiter enforces per-tier limits
describe('S03-A12: Rate limiter', () => {
  it('blocks after free tier limit exceeded', () => {
    const limiter = new RateLimiter({ free: 3, pro: 10, windowMs: 60000 });

    expect(limiter.check('user-1', 'free')).toBe(true);
    expect(limiter.check('user-1', 'free')).toBe(true);
    expect(limiter.check('user-1', 'free')).toBe(true);
    expect(limiter.check('user-1', 'free')).toBe(false); // 4th request blocked
  });

  it('allows pro users higher limits', () => {
    const limiter = new RateLimiter({ free: 2, pro: 5, windowMs: 60000 });

    for (let i = 0; i < 5; i++) {
      expect(limiter.check('user-2', 'pro')).toBe(true);
    }
    expect(limiter.check('user-2', 'pro')).toBe(false); // 6th blocked
  });
});

// S03-A13: System prompt from spec Section 10 is integrated verbatim
describe('S03-A13: System prompt matches spec', () => {
  it('contains key spec phrases', () => {
    expect(ORCHESTRATOR_SYSTEM_PROMPT).toContain('You are the LearnFlow Orchestrator Agent');
    expect(ORCHESTRATOR_SYSTEM_PROMPT).toContain(
      'central intelligence of a multi-agent learning platform',
    );
    expect(ORCHESTRATOR_SYSTEM_PROMPT).toContain('Student Context Object');
    expect(ORCHESTRATOR_SYSTEM_PROMPT).toContain('course_builder');
    expect(ORCHESTRATOR_SYSTEM_PROMPT).toContain('notes_agent');
    expect(ORCHESTRATOR_SYSTEM_PROMPT).toContain('exam_agent');
    expect(ORCHESTRATOR_SYSTEM_PROMPT).toContain('research_agent');
    expect(ORCHESTRATOR_SYSTEM_PROMPT).toContain('BEHAVIORAL ADAPTATION');
    expect(ORCHESTRATOR_SYSTEM_PROMPT).toContain('ERROR HANDLING');
  });

  it('is stored on the orchestrator instance', () => {
    const registry = new AgentRegistry();
    const orchestrator = new Orchestrator(registry);
    expect(orchestrator.systemPrompt).toBe(ORCHESTRATOR_SYSTEM_PROMPT);
  });
});

// S03-A14: All agent message envelopes match spec Section 4.3 schema
describe('S03-A14: Agent message envelope schema', () => {
  it('creates properly typed envelope', () => {
    const registry = new AgentRegistry();
    const orchestrator = new Orchestrator(registry);
    const ctx = createMockContext();

    const envelope = orchestrator.createEnvelope('course_builder', ctx, 'build_course', {
      topic: 'Python',
    });

    expect(envelope.message_id).toBeDefined();
    expect(envelope.from_agent).toBe('orchestrator');
    expect(envelope.to_agent).toBe('course_builder');
    expect(envelope.context.user_id).toBe('user-1');
    expect(envelope.context.goals).toEqual(['Learn Python']);
    expect(envelope.task.type).toBe('build_course');
    expect(envelope.task.params).toEqual({ topic: 'Python' });
    expect(envelope.response_schema).toBeDefined();
    expect(envelope.timeout_ms).toBe(30000);
    expect(envelope.priority).toBe('normal');
  });
});

// S03-A15: Orchestrator spawns course_builder and returns structured syllabus
describe('S03-A15: Orchestrator integration with course_builder', () => {
  it('spawns course_builder and returns response', async () => {
    const registry = new AgentRegistry();
    const mockSyllabus = {
      text: 'Python Course Outline:\n1. Introduction to Python\n2. Variables and Data Types\n3. Control Flow',
    };
    const courseBuilder = createMockAgent('course_builder', ['build_course'], mockSyllabus);
    registry.register(courseBuilder);

    const orchestrator = new Orchestrator(registry);
    const ctx = createMockContext();

    const response = await orchestrator.processMessage('I want to learn Python programming', ctx);

    expect(response.text).toContain('Python Course Outline');
    expect(response.agentResults).toHaveLength(1);
    expect(response.agentResults[0].agentName).toBe('course_builder');
    expect(response.agentResults[0].status).toBe('success');
  });
});
