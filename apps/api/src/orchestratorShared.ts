import { db, dbMarketplace, dbMarketplaceAgentSubmissions } from './db.js';
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

  return {
    userId,
    user,
    currentCourseId: undefined,
    currentLessonId: undefined,
    enrolledCourseIds: [],
    completedLessonIds: [],
    goals: user.goals,
    strengths: [],
    weaknesses: [],
    learningStyle: 'reading',
    quizScores: {},
    studyStreak: 0,
    totalStudyMinutes: 0,
    lastActiveAt: new Date(),

    goalDetails: user.goals.map((g) => ({ goal: g, priority: 'medium' as const })),
    interests: [],
    browseHistory: [],
    searchQueries: [],
    bookmarkedContent: [],
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
