export type StudentContext = {
  userId?: string;
  goals: string[];
  topics: string[];
  experience: string;
  onboardingCompletedAt?: string | null;
  strengths?: string[];
  weaknesses?: string[];
  learningStyle?: string;
  quizScores?: Record<string, number>;
  studyStreak?: number;
  totalStudyMinutes?: number;
  subscriptionTier?: string;
  role?: string;
  lastActiveAt?: string;
  progress?: any;
  preferences?: {
    notifications?: {
      email?: boolean;
      push?: boolean;
      inApp?: boolean;
    };
    preferredLessonLength?: number;
    preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  };
  lessonRatings?: Record<string, number>;
  agentRatings?: Record<string, number>;
};

const KEY = 'learnflow-student-context';

export function loadStudentContext(): StudentContext | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudentContext;
  } catch {
    return null;
  }
}

export function saveStudentContext(ctx: StudentContext): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ctx));
  } catch {
    // ignore quota
  }
}
