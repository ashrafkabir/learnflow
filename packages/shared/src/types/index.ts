export * from './ws.js';

/** User — represents a platform user (student, creator, admin) */
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'student' | 'creator' | 'admin';
  tier: 'free' | 'pro';
  goals: string[];
  preferredLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Course — an AI-generated or creator-published learning course */
export interface Course {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  modules: Module[];
  authorId: string;
  published: boolean;
  price: number;
  currency: string;
  tags: string[];
  rating: number;
  enrollmentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Module — a grouping of related lessons within a course */
export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

/** Lesson — a single learning unit with content and exercises */
export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  summary: string;
  estimatedMinutes: number;
  order: number;
  type: 'reading' | 'video' | 'exercise' | 'quiz';
  resources: Resource[];
  completed: boolean;
}

/** Resource — a source or reference linked to a lesson */
export interface Resource {
  url: string;
  title: string;
  author?: string;
  license?: string;
}

/** Agent — an AI agent registered in the platform */
export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  version: string;
  modelProvider: string;
  modelId: string;
  systemPrompt: string;
  active: boolean;
  tier: 'free' | 'pro';
  createdAt: Date;
  updatedAt: Date;
}

/** StudentContext — the runtime context object passed to agents */
export interface StudentContext {
  userId: string;
  user: User;
  currentCourseId?: string;
  currentLessonId?: string;
  enrolledCourseIds: string[];
  completedLessonIds: string[];
  goals: string[];
  strengths: string[];
  weaknesses: string[];
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  quizScores: Record<string, number>;
  studyStreak: number;
  totalStudyMinutes: number;
  lastActiveAt: Date;
}
