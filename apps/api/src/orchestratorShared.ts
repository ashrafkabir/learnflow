import {
  db,
  dbMarketplace,
  dbMarketplaceAgentSubmissions,
  dbBookmarks,
  dbEvents,
  dbCourses,
  dbProgress,
} from './db.js';
import { resolveMarketplaceAgentManifest } from './lib/marketplaceAgents.js';
import type { StudentContextObject } from '@learnflow/core';
import { AgentRegistry, Orchestrator } from '@learnflow/core';
import {
  CollaborationAgent,
  CourseBuilderAgent,
  ExamAgent,
  ExportAgent,
  MindmapAgent,
  NotesAgent,
  ResearchAgent,
  SummarizerAgent,
  TutorAgent,
} from '@learnflow/agents';

export function buildStudentContext(userId: string): StudentContextObject {
  const dbUser = db.findUserById(userId);

  const user = {
    id: userId,
    email: dbUser?.email || 'dev@learnflow.local',
    displayName: dbUser?.displayName || 'Learner',
    role: (dbUser?.role || 'student') as 'student' | 'creator' | 'admin',
    tier: (dbUser?.tier || 'free') as 'free' | 'pro',
    goals: (dbUser?.goals || []) as string[],
    preferredLanguage: dbUser?.preferredLanguage || 'en',
    createdAt: dbUser?.createdAt || new Date(),
    updatedAt: dbUser?.updatedAt || new Date(),
  };

  const stats = (() => {
    try {
      // Uses progress + learning_events.
      // Best-effort: if DB unavailable, fall back to zeros.
      return dbProgress.getUserStats(userId) as any;
    } catch {
      return { totalStudyMinutes: 0, currentStreak: 0 } as any;
    }
  })();

  const { enrolledCourseIds, completedLessonIds } = (() => {
    try {
      const allCourses = dbCourses.getAll() as any[];
      const mine = allCourses
        .filter((c) => String(c?.authorId || '') === userId)
        .filter((c) => String(c?.origin || 'user') === 'user');
      const enrolled = mine.map((c) => String(c.id)).filter(Boolean);

      const completed = new Set<string>();
      for (const c of mine) {
        try {
          const ids = dbProgress.getCompletedLessons(userId, String(c.id));
          for (const lid of ids) completed.add(String(lid));
        } catch {
          // ignore per-course
        }
      }

      return { enrolledCourseIds: enrolled, completedLessonIds: Array.from(completed) };
    } catch {
      return { enrolledCourseIds: [] as string[], completedLessonIds: [] as string[] };
    }
  })();

  return {
    userId,
    user,
    currentCourseId: undefined,
    currentLessonId: undefined,
    enrolledCourseIds,
    completedLessonIds,
    goals: user.goals,
    strengths: [],
    weaknesses: [],
    learningStyle: 'reading',
    quizScores: {},
    studyStreak: Number(stats?.currentStreak || 0),
    totalStudyMinutes: Number(stats?.totalStudyMinutes || 0),
    lastActiveAt: new Date(),

    goalDetails: user.goals.map((g) => ({ goal: g, priority: 'medium' as const })),
    interests: [],
    // Iter123: hydrate minimal persisted slices.
    // NOTE: StudentContextObject contract expects string[] for these fields.
    browseHistory: (() => {
      try {
        const events = dbEvents.list(userId, 200) as any[];
        const out: string[] = [];
        for (const e of events) {
          if (e.type === 'lesson.view_start' && e.lessonId) out.push(String(e.lessonId));
        }
        return out.slice(0, 50);
      } catch {
        return [];
      }
    })(),
    searchQueries: (() => {
      try {
        const events = dbEvents.list(userId, 200) as any[];
        const out: string[] = [];
        for (const e of events) {
          if (e.type === 'search.query') {
            try {
              const meta = JSON.parse(e.meta || '{}');
              const q = String(meta?.query || '').trim();
              if (q) out.push(q);
            } catch {
              // ignore
            }
          }
        }
        return out.slice(0, 50);
      } catch {
        return [];
      }
    })(),
    bookmarkedContent: (() => {
      try {
        const rows = dbBookmarks.list(userId, 200) as any[];
        return rows.map((b: any) => String(b.lessonId)).slice(0, 200);
      } catch {
        return [];
      }
    })(),
    sessionFrequency: 0,
    preferredTimeOfDay: 'morning',
    preferredLessonLength: 10,
    subscriptionTier: user.tier,
    billingStatus: 'active',
    apiKeyProvider: undefined,
    usageQuotas: {},
    notificationSettings: { email: true, push: true, inApp: true },
    preferredAgents: dbMarketplace.getActivatedAgents(userId),
    marketplaceAgentManifests: (() => {
      const ids = dbMarketplace.getActivatedAgents(userId);
      const approved = dbMarketplaceAgentSubmissions.listApproved();
      const approvedById = new Map(approved.map((a) => [String(a.id), a]));
      return ids
        .map((id) => {
          const row = approvedById.get(String(id));
          return resolveMarketplaceAgentManifest({ agentId: String(id), manifest: row?.manifest });
        })
        .filter(Boolean) as any;
    })(),
    displayPreferences: { theme: 'light', fontSize: 16 },
    collaborationOptIn: false,
    peerConnections: [],
    sharedCourses: [],
    lessonRatings: {},
    agentRatings: {},
    courseReviews: [],
  };
}

let singletonOrchestrator: Orchestrator | null = null;
export async function getOrchestrator(): Promise<Orchestrator> {
  if (singletonOrchestrator) return singletonOrchestrator;

  const registry = new AgentRegistry();
  const agents = [
    new CourseBuilderAgent(),
    new NotesAgent(),
    new ExamAgent(),
    new ResearchAgent(),
    new SummarizerAgent(),
    new TutorAgent(),
    new MindmapAgent(),
    new CollaborationAgent(),
    new ExportAgent(),
  ];

  for (const a of agents) {
    await a.initialize();
    registry.register(a);
  }

  singletonOrchestrator = new Orchestrator(registry);
  return singletonOrchestrator;
}

export function mapActions(actions: string[]): Array<{ type: string; label: string }> {
  return (actions || []).slice(0, 5).map((label) => ({
    type: label.toLowerCase().replace(/\s+/g, '_'),
    label,
  }));
}

export function makeSourcesFromLesson(lessonContent: string): Array<{
  title: string;
  author?: string;
  publication?: string;
  year?: number;
  url: string;
}> {
  // Use the shared structured parser (keeps schemas aligned across API surfaces).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { parseLessonSources } = require('./utils/sources.js');
  return parseLessonSources(lessonContent);
}
