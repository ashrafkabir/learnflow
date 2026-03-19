import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// Types
export interface Course {
  id: string;
  title: string;
  description: string;
  topic: string;
  depth: string;
  modules: Module[];
  progress: Record<string, number>;
  createdAt: string;
}

export interface Module {
  id: string;
  title: string;
  objective: string;
  description: string;
  lessons: Lesson[];
}

export interface LessonSource {
  title: string;
  author?: string;
  publication?: string;
  year?: number;
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  estimatedTime: number;
  wordCount: number;
  sources?: LessonSource[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Notes {
  format: 'cornell' | 'flashcard' | 'zettelkasten';
  content: string;
  cueQuestions?: string[];
  summary?: string;
  flashcards?: Array<{ front: string; back: string }>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  questions: QuizQuestion[];
  score?: number;
  answers?: Record<string, string>;
  submitted?: boolean;
  gaps?: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  goals: string[];
  topics: string[];
  experience: string;
  dailyGoal: number;
  darkMode: boolean;
  notifications: boolean;
}

// Subscription
export type SubscriptionTier = 'free' | 'pro';

export interface Notification {
  id: string;
  type: 'agent' | 'progress' | 'system';
  message: string;
  timestamp: string;
  read: boolean;
}

// State
interface AppState {
  onboarding: {
    completed: boolean;
    step: number;
    goals: string[];
    topics: string[];
    experience: string;
  };
  courses: Course[];
  activeCourse: Course | null;
  activeLesson: Lesson | null;
  chat: ChatMessage[];
  notes: Notes | null;
  quiz: Quiz | null;
  profile: UserProfile;
  loading: Record<string, boolean>;
  streak: number;
  completedLessons: Set<string>;
  subscription: SubscriptionTier;
  notifications: Notification[];

  // Mindmap suggestions (dashed/dimmed nodes) emitted by the server.
  // Keyed by courseId (or "global" if unknown).
  mindmapSuggestions: Record<
    string,
    Array<{ id: string; label: string; parentLessonId?: string; reason?: string }>
  >;
}

type Action =
  | { type: 'SET_ONBOARDING_STEP'; step: number }
  | { type: 'SET_ONBOARDING_GOALS'; goals: string[] }
  | { type: 'SET_ONBOARDING_TOPICS'; topics: string[] }
  | { type: 'SET_ONBOARDING_EXPERIENCE'; experience: string }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'SET_COURSES'; courses: Course[] }
  | { type: 'ADD_COURSE'; course: Course }
  | { type: 'SET_ACTIVE_COURSE'; course: Course | null }
  | { type: 'SET_ACTIVE_LESSON'; lesson: Lesson | null }
  | { type: 'ADD_CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'SET_CHAT'; messages: ChatMessage[] }
  | { type: 'SET_NOTES'; notes: Notes | null }
  | { type: 'SET_QUIZ'; quiz: Quiz | null }
  | { type: 'SUBMIT_QUIZ'; answers: Record<string, string> }
  | { type: 'SET_LOADING'; key: string; value: boolean }
  | { type: 'COMPLETE_LESSON'; lessonId: string }
  | { type: 'UPDATE_PROFILE'; profile: Partial<UserProfile> }
  | { type: 'SET_SUBSCRIPTION'; tier: SubscriptionTier }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'DISMISS_NOTIFICATION'; id: string }
  | {
      type: 'SET_MINDMAP_SUGGESTIONS';
      courseId: string;
      suggestions: Array<{ id: string; label: string; parentLessonId?: string; reason?: string }>;
    }
  | {
      type: 'SET_ANALYTICS';
      streak: number;
      totalStudyMinutes: number;
      totalLessonsCompleted: number;
    };

const initialState: AppState = {
  onboarding: {
    completed: localStorage.getItem('learnflow-onboarding-complete') === 'true',
    step: 0,
    goals: [],
    topics: [],
    experience: '',
  },
  courses: [],
  activeCourse: null,
  activeLesson: null,
  chat: (() => {
    try {
      return JSON.parse(localStorage.getItem('learnflow-chat') || '[]');
    } catch {
      return [];
    }
  })(),
  notes: null,
  quiz: null,
  profile: {
    name: '',
    email: '',
    goals: [],
    topics: [],
    experience: 'beginner',
    dailyGoal: 30,
    darkMode: false,
    notifications: true,
  },
  loading: {},
  streak: 0,
  completedLessons: new Set(),
  subscription: (localStorage.getItem('learnflow-subscription') as SubscriptionTier) || 'free',
  notifications: JSON.parse(localStorage.getItem('learnflow-notifications') || '[]'),
  mindmapSuggestions: (() => {
    try {
      return JSON.parse(localStorage.getItem('learnflow-mindmap-suggestions') || '{}');
    } catch {
      return {};
    }
  })(),
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ONBOARDING_STEP':
      return { ...state, onboarding: { ...state.onboarding, step: action.step } };
    case 'SET_ONBOARDING_GOALS':
      return { ...state, onboarding: { ...state.onboarding, goals: action.goals } };
    case 'SET_ONBOARDING_TOPICS':
      return { ...state, onboarding: { ...state.onboarding, topics: action.topics } };
    case 'SET_ONBOARDING_EXPERIENCE':
      return { ...state, onboarding: { ...state.onboarding, experience: action.experience } };
    case 'COMPLETE_ONBOARDING':
      localStorage.setItem('learnflow-onboarding-complete', 'true');
      return { ...state, onboarding: { ...state.onboarding, completed: true } };
    case 'SET_COURSES': {
      // Deduplicate by ID
      const map = new Map(action.courses.map((c) => [c.id, c]));
      return { ...state, courses: Array.from(map.values()) };
    }
    case 'ADD_COURSE': {
      // Avoid duplicates
      const exists = state.courses.find((c) => c.id === action.course.id);
      if (exists)
        return {
          ...state,
          courses: state.courses.map((c) => (c.id === action.course.id ? action.course : c)),
        };
      return { ...state, courses: [...state.courses, action.course] };
    }
    case 'SET_ACTIVE_COURSE':
      return { ...state, activeCourse: action.course };
    case 'SET_ACTIVE_LESSON':
      return { ...state, activeLesson: action.lesson };
    case 'ADD_CHAT_MESSAGE': {
      const newChat = [...state.chat, action.message];
      try {
        localStorage.setItem('learnflow-chat', JSON.stringify(newChat.slice(-100)));
      } catch {
        /* quota */
      }
      return { ...state, chat: newChat };
    }
    case 'SET_CHAT':
      try {
        localStorage.setItem('learnflow-chat', JSON.stringify(action.messages.slice(-100)));
      } catch {
        /* quota */
      }
      return { ...state, chat: action.messages };
    case 'SET_NOTES':
      return { ...state, notes: action.notes };
    case 'SET_QUIZ':
      return { ...state, quiz: action.quiz };
    case 'SUBMIT_QUIZ': {
      if (!state.quiz) return state;
      const answers = action.answers;
      let correct = 0;
      const gaps: string[] = [];
      state.quiz.questions.forEach((q) => {
        if (answers[q.id] === q.correctAnswer) correct++;
        else gaps.push(q.question);
      });
      const score = Math.round((correct / state.quiz.questions.length) * 100);
      return { ...state, quiz: { ...state.quiz, answers, submitted: true, score, gaps } };
    }
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.key]: action.value } };
    case 'COMPLETE_LESSON':
      return { ...state, completedLessons: new Set([...state.completedLessons, action.lessonId]) };
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.profile } };
    case 'SET_SUBSCRIPTION':
      localStorage.setItem('learnflow-subscription', action.tier);
      return { ...state, subscription: action.tier };
    case 'ADD_NOTIFICATION': {
      const notifs = [action.notification, ...state.notifications].slice(0, 50);
      localStorage.setItem('learnflow-notifications', JSON.stringify(notifs));
      return { ...state, notifications: notifs };
    }
    case 'DISMISS_NOTIFICATION': {
      const notifs2 = state.notifications.filter((n) => n.id !== action.id);
      localStorage.setItem('learnflow-notifications', JSON.stringify(notifs2));
      return { ...state, notifications: notifs2 };
    }
    case 'SET_MINDMAP_SUGGESTIONS': {
      const next = {
        ...state.mindmapSuggestions,
        [action.courseId]: action.suggestions,
      };
      try {
        localStorage.setItem('learnflow-mindmap-suggestions', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return { ...state, mindmapSuggestions: next };
    }
    case 'SET_ANALYTICS':
      return { ...state, streak: action.streak };
    default:
      return state;
  }
}

// API helpers
const API = '/api/v1';

// Token refresh — Spec §11.1 WS-02
async function refreshTokenIfNeeded(): Promise<void> {
  const token = localStorage.getItem('learnflow-token');
  if (!token) return;
  try {
    // Decode JWT to check expiry (simple base64 decode)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() > expiresAt - fiveMinutes) {
      const refreshToken = localStorage.getItem('learnflow-refresh');
      if (!refreshToken) return;
      const res = await fetch(`${apiBase()}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('learnflow-token', data.accessToken);
        localStorage.setItem('learnflow-refresh', data.refreshToken);
      } else {
        localStorage.removeItem('learnflow-token');
        localStorage.removeItem('learnflow-refresh');
        localStorage.removeItem('learnflow-user');
      }
    }
  } catch {
    /* ignore decode errors */
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('learnflow-token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export function apiBase(): string {
  if (
    typeof window !== 'undefined' &&
    window.location?.origin &&
    window.location.origin !== 'null'
  ) {
    return '';
  }
  return 'http://localhost:3002';
}

async function apiPost(path: string, body: unknown) {
  await refreshTokenIfNeeded();
  try {
    const res = await fetch(`${apiBase()}${API}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      if (res.status === 401) {
        console.warn('[LearnFlow] 401 — unauthorized');
        localStorage.removeItem('learnflow-token');
        localStorage.removeItem('learnflow-refresh');
        localStorage.removeItem('learnflow-user');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.error('[LearnFlow] apiPost error:', err);
    throw err;
  }
}

export async function apiGet(path: string) {
  await refreshTokenIfNeeded();
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${apiBase()}${API}${path}`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.error('[LearnFlow] apiGet error:', err);
    throw err;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  createCourse: (topic: string) => Promise<Course>;
  fetchCourse: (id: string) => Promise<Course>;
  fetchLesson: (courseId: string, lessonId: string) => Promise<Lesson>;
  sendChat: (message: string) => Promise<void>;
  generateNotes: (lessonId: string, format: string) => Promise<Notes>;
  generateQuiz: (courseId: string, moduleId: string) => Promise<Quiz>;
  completeLesson: (courseId: string, lessonId: string) => Promise<void>;
  searchResearch: (query: string) => Promise<unknown>;
  addTopicToCourse: (
    courseId: string,
    topic: string,
    opts?: { parentLessonId?: string },
  ) => Promise<{ course: Course; pipelineId?: string }>;
  webSearch: (
    query: string,
    limit?: number,
  ) => Promise<{
    query: string;
    results: Array<{ url: string; title: string; description?: string; source?: string }>;
  }>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const createCourse = useCallback(async (topic: string): Promise<Course> => {
    dispatch({ type: 'SET_LOADING', key: 'createCourse', value: true });
    try {
      const course = await apiPost('/courses', { topic });
      if (course && course.id) {
        dispatch({ type: 'ADD_COURSE', course });
        dispatch({ type: 'SET_ACTIVE_COURSE', course });
      }
      return course;
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'createCourse', value: false });
    }
  }, []);

  const fetchCourse = useCallback(async (id: string): Promise<Course> => {
    dispatch({ type: 'SET_LOADING', key: 'fetchCourse', value: true });
    try {
      const course = await apiGet(`/courses/${id}`);
      dispatch({ type: 'SET_ACTIVE_COURSE', course });
      return course;
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'fetchCourse', value: false });
    }
  }, []);

  const fetchLesson = useCallback(async (courseId: string, lessonId: string): Promise<Lesson> => {
    dispatch({ type: 'SET_LOADING', key: 'fetchLesson', value: true });
    try {
      const lesson = await apiGet(`/courses/${courseId}/lessons/${lessonId}`);
      dispatch({ type: 'SET_ACTIVE_LESSON', lesson });
      return lesson;
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'fetchLesson', value: false });
    }
  }, []);

  const sendChat = useCallback(
    async (message: string) => {
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_CHAT_MESSAGE', message: userMsg });
      dispatch({ type: 'SET_LOADING', key: 'chat', value: true });
      try {
        // Pass current lesson/course context and conversation history
        const recentHistory = state.chat
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }));
        const payload: Record<string, unknown> = { message, history: recentHistory };
        if (state.activeCourse) payload.courseId = state.activeCourse.id;
        if (state.activeLesson) payload.lessonId = state.activeLesson.id;

        const data = await apiPost('/chat', payload);
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-reply`,
          role: 'assistant',
          content: data.reply || data.message || 'I can help you with that!',
          timestamp: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_CHAT_MESSAGE', message: assistantMsg });
      } catch {
        const errMsg: ChatMessage = {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_CHAT_MESSAGE', message: errMsg });
      } finally {
        dispatch({ type: 'SET_LOADING', key: 'chat', value: false });
      }
    },
    [state.activeCourse, state.activeLesson],
  );

  const generateNotes = useCallback(async (lessonId: string, format: string): Promise<Notes> => {
    dispatch({ type: 'SET_LOADING', key: 'notes', value: true });
    try {
      const data = await apiPost('/chat', {
        message: `Generate ${format} notes for this lesson`,
        agent: 'notes',
        lessonId,
        format,
      });
      const notes: Notes = data.notes || {
        format: format as Notes['format'],
        content: data.reply || data.message || '',
        cueQuestions: data.cueQuestions || [],
        summary: data.summary || '',
        flashcards: data.flashcards || [],
      };
      dispatch({ type: 'SET_NOTES', notes });
      return notes;
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'notes', value: false });
    }
  }, []);

  const generateQuiz = useCallback(async (courseId: string, moduleId: string): Promise<Quiz> => {
    dispatch({ type: 'SET_LOADING', key: 'quiz', value: true });
    try {
      const data = await apiPost('/chat', {
        message: `Generate a quiz for module ${moduleId}`,
        agent: 'exam',
        courseId,
        moduleId,
      });
      const quiz: Quiz = {
        questions: data.questions || data.quiz?.questions || [],
        submitted: false,
      };
      dispatch({ type: 'SET_QUIZ', quiz });
      return quiz;
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'quiz', value: false });
    }
  }, []);

  const completeLessonAction = useCallback(async (courseId: string, lessonId: string) => {
    await apiPost(`/courses/${courseId}/lessons/${lessonId}/complete`, {});
    dispatch({ type: 'COMPLETE_LESSON', lessonId });
  }, []);

  const searchResearch = useCallback(async (query: string) => {
    dispatch({ type: 'SET_LOADING', key: 'research', value: true });
    try {
      const data = await apiPost('/chat', { message: query, agent: 'research' });
      return data;
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'research', value: false });
    }
  }, []);

  const addTopicToCourse = useCallback(
    async (
      courseId: string,
      topic: string,
      opts: { parentLessonId?: string } = {},
    ): Promise<{ course: Course; pipelineId?: string }> => {
      dispatch({ type: 'SET_LOADING', key: 'addTopic', value: true });
      try {
        // Prefer pipeline UX when available.
        try {
          const started = await apiPost(`/pipeline/add-topic`, {
            courseId,
            topic,
            parentLessonId: opts.parentLessonId,
          });
          if (started?.pipelineId) {
            // Return minimal stub; caller can navigate to pipeline detail.
            return {
              course: (state.activeCourse as Course) || ({ id: courseId } as any),
              pipelineId: started.pipelineId,
            };
          }
        } catch {
          // Fall back to direct add-topic.
        }

        const data = await apiPost(`/courses/${courseId}/add-topic`, {
          topic,
          parentLessonId: opts.parentLessonId,
        });
        const nextCourse = (data?.course || data) as Course;
        if (nextCourse?.id) {
          dispatch({ type: 'ADD_COURSE', course: nextCourse });
          dispatch({ type: 'SET_ACTIVE_COURSE', course: nextCourse });
        }
        return { course: nextCourse };
      } finally {
        dispatch({ type: 'SET_LOADING', key: 'addTopic', value: false });
      }
    },
    [state.activeCourse],
  );

  const webSearch = useCallback(
    async (
      query: string,
      limit = 5,
    ): Promise<{
      query: string;
      results: Array<{ url: string; title: string; description?: string; source?: string }>;
    }> => {
      dispatch({ type: 'SET_LOADING', key: 'webSearch', value: true });
      try {
        const q = encodeURIComponent(query);
        const data = await apiGet(`/search?q=${q}&limit=${limit}`);
        return data;
      } finally {
        dispatch({ type: 'SET_LOADING', key: 'webSearch', value: false });
      }
    },
    [],
  );

  const value: AppContextType = {
    state,
    dispatch,
    createCourse,
    fetchCourse,
    fetchLesson,
    sendChat,
    generateNotes,
    generateQuiz,
    completeLesson: completeLessonAction,
    searchResearch,
    addTopicToCourse,
    webSearch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
