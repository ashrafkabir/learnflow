import type { StudentContext, User } from '@learnflow/shared';

/**
 * StudentContextObject — full runtime context passed to agents.
 * Matches spec Section 9.1 data points.
 */
export interface StudentContextObject extends StudentContext {
  // Goals with metadata (spec 9.1)
  goalDetails: Array<{
    goal: string;
    targetDate?: Date;
    priority: 'low' | 'medium' | 'high';
  }>;
  // Interests (spec 9.1)
  interests: string[];
  browseHistory: string[];
  searchQueries: string[];
  bookmarkedContent: string[];
  // Activity patterns (spec 9.1)
  sessionFrequency: number;
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  preferredLessonLength: number;
  // Subscription info (spec 9.1)
  subscriptionTier: 'free' | 'pro';
  billingStatus: 'active' | 'inactive' | 'past_due';
  apiKeyProvider?: string;
  usageQuotas: Record<string, number>;
  // Preferences (spec 9.1)
  notificationSettings: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  preferredAgents: string[];
  /**
   * Activated marketplace agent manifests available for routing decisions.
   * Optional because many environments don't fetch/attach manifests.
   */
  marketplaceAgentManifests?: Array<{
    id: string;
    name?: string;
    taskTypes: string[];
    routesToAgentName: string;
  }>;
  displayPreferences: {
    theme: 'light' | 'dark';
    fontSize: number;
  };
  // Social (spec 9.1)
  collaborationOptIn: boolean;
  peerConnections: string[];
  sharedCourses: string[];
  // Feedback (spec 9.1)
  lessonRatings: Record<string, number>;
  agentRatings: Record<string, number>;
  courseReviews: string[];
}

/**
 * Build a StudentContextObject from DB data.
 */
export interface ContextStore {
  getUser(userId: string): Promise<User | null>;
  getEnrolledCourseIds(userId: string): Promise<string[]>;
  getCompletedLessonIds(userId: string): Promise<string[]>;
  getQuizScores(userId: string): Promise<Record<string, number>>;
  getStudyStreak(userId: string): Promise<number>;
  getTotalStudyMinutes(userId: string): Promise<number>;
  getLastActiveAt(userId: string): Promise<Date>;
}

export class StudentContextLoader {
  constructor(private store: ContextStore) {}

  async load(userId: string): Promise<StudentContextObject | null> {
    const user = await this.store.getUser(userId);
    if (!user) return null;

    const [
      enrolledCourseIds,
      completedLessonIds,
      quizScores,
      studyStreak,
      totalStudyMinutes,
      lastActiveAt,
    ] = await Promise.all([
      this.store.getEnrolledCourseIds(userId),
      this.store.getCompletedLessonIds(userId),
      this.store.getQuizScores(userId),
      this.store.getStudyStreak(userId),
      this.store.getTotalStudyMinutes(userId),
      this.store.getLastActiveAt(userId),
    ]);

    return {
      userId,
      user,
      enrolledCourseIds,
      completedLessonIds,
      goals: user.goals,
      strengths: [],
      weaknesses: [],
      learningStyle: 'reading',
      quizScores,
      studyStreak,
      totalStudyMinutes,
      lastActiveAt,
      goalDetails: user.goals.map((g) => ({
        goal: g,
        priority: 'medium' as const,
      })),
      interests: [],
      browseHistory: [],
      searchQueries: [],
      bookmarkedContent: [],
      sessionFrequency: 0,
      preferredTimeOfDay: 'morning',
      preferredLessonLength: 10,
      subscriptionTier: user.tier,
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
    };
  }
}
