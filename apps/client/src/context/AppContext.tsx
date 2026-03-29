import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import { toActionableHttpErrorMessage } from './httpErrors.js';
import { useToast } from '../components/Toast.js';
import { loadStudentContext, saveStudentContext } from '../lib/studentContext.js';

// Types
export interface Course {
  id: string;
  title: string;
  description: string;
  topic: string;
  depth: string;
  modules: Module[];
  progress: Record<string, number>;
  plan?: any;
  createdAt: string;

  // Iter77: status & stall metadata for restartability UX
  status?: 'CREATING' | 'READY' | 'FAILED';
  error?: string;
  generationAttempt?: number;
  generationStartedAt?: string | null;
  lastProgressAt?: string | null;
  failedAt?: string | null;
  failureReason?: string;
  failureMessage?: string;
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

  // Iter121 Task 2: UX transparency for demo/mock mode
  sourcesMissingReason?: string;
  sourceMode?: 'real' | 'mock';

  // Iter135: persisted rails
  takeaways?: string[];
  relatedImages?: Array<{
    url: string;
    alt?: string;
    credit?: string;
    license?: string;
    sourceUrl?: string;
    pageUrl?: string;
  }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;

  /** Agent transparency (Iter91): best-effort metadata about how the message was generated. */
  meta?: {
    generatedBy?: string;
    sourcesCount?: number;
  };
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
  meta?: {
    topic?: string;
    url?: string;
    sourceUrl?: string;
    sourceDomain?: string;
    checkedAt?: string | null;
    explanation?: string;
  };
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
  capabilities: Record<string, boolean>;
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
  | { type: 'SET_CAPABILITIES'; capabilities: Record<string, boolean> }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'DISMISS_NOTIFICATION'; id: string }
  | { type: 'SET_NOTIFICATIONS'; notifications: Notification[] }
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

const safeLocalStorageGet = (key: string): string | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeLocalStorageGetJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = safeLocalStorageGet(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const initialStudentContext = loadStudentContext();

const initialState: AppState = {
  onboarding: {
    completed:
      safeLocalStorageGet('learnflow-onboarding-complete') === 'true' ||
      Boolean(initialStudentContext?.onboardingCompletedAt),
    step: 0,
    goals: initialStudentContext?.goals || [],
    topics: initialStudentContext?.topics || [],
    experience: initialStudentContext?.experience || '',
  },
  courses: [],
  activeCourse: null,
  activeLesson: null,
  chat: safeLocalStorageGetJson('learnflow-chat', [] as any),
  notes: null,
  quiz: null,
  profile: {
    name: '',
    email: '',
    goals: initialStudentContext?.goals || [],
    topics: initialStudentContext?.topics || [],
    experience: initialStudentContext?.experience || 'beginner',
    dailyGoal: 30,
    darkMode: false,
    notifications: true,
  },
  loading: {},
  streak: 0,
  completedLessons: new Set(),
  // Subscription is server-driven; default to free until hydrated from GET /subscription.
  subscription: 'free',
  capabilities: {},
  notifications: safeLocalStorageGetJson('learnflow-notifications', [] as any),
  mindmapSuggestions: safeLocalStorageGetJson('learnflow-mindmap-suggestions', {} as any),
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ONBOARDING_STEP':
      return { ...state, onboarding: { ...state.onboarding, step: action.step } };
    case 'SET_ONBOARDING_GOALS': {
      const next = { ...state, onboarding: { ...state.onboarding, goals: action.goals } };
      saveStudentContext({
        goals: next.onboarding.goals,
        topics: next.onboarding.topics,
        experience: next.onboarding.experience || 'beginner',
        onboardingCompletedAt: initialStudentContext?.onboardingCompletedAt || null,
      });
      return next;
    }
    case 'SET_ONBOARDING_TOPICS': {
      const next = { ...state, onboarding: { ...state.onboarding, topics: action.topics } };
      saveStudentContext({
        goals: next.onboarding.goals,
        topics: next.onboarding.topics,
        experience: next.onboarding.experience || 'beginner',
        onboardingCompletedAt: initialStudentContext?.onboardingCompletedAt || null,
      });
      return next;
    }
    case 'SET_ONBOARDING_EXPERIENCE': {
      const next = { ...state, onboarding: { ...state.onboarding, experience: action.experience } };
      saveStudentContext({
        goals: next.onboarding.goals,
        topics: next.onboarding.topics,
        experience: next.onboarding.experience || 'beginner',
        onboardingCompletedAt: initialStudentContext?.onboardingCompletedAt || null,
      });
      return next;
    }
    case 'COMPLETE_ONBOARDING':
      localStorage.setItem('learnflow-onboarding-complete', 'true');
      saveStudentContext({
        goals: state.onboarding.goals,
        topics: state.onboarding.topics,
        experience: state.onboarding.experience || 'beginner',
        onboardingCompletedAt: new Date().toISOString(),
      });
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
      const scoreRaw = Math.round((correct / state.quiz.questions.length) * 100);
      const score = Math.min(100, Math.max(0, scoreRaw));
      return { ...state, quiz: { ...state.quiz, answers, submitted: true, score, gaps } };
    }
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.key]: action.value } };
    case 'COMPLETE_LESSON':
      return { ...state, completedLessons: new Set([...state.completedLessons, action.lessonId]) };
    case 'UPDATE_PROFILE': {
      const nextProfile = { ...state.profile, ...action.profile };
      // Keep a durable Student Context Object for UX continuity (best-effort).
      // Server remains source of truth when authenticated.
      saveStudentContext({
        goals: nextProfile.goals || [],
        topics: nextProfile.topics || [],
        experience: nextProfile.experience || 'beginner',
        onboardingCompletedAt:
          safeLocalStorageGet('learnflow-onboarding-complete') === 'true'
            ? new Date().toISOString()
            : initialStudentContext?.onboardingCompletedAt || null,
      });
      return { ...state, profile: nextProfile };
    }
    case 'SET_SUBSCRIPTION':
      // Subscription is server-driven; do not persist tier in localStorage.
      return { ...state, subscription: action.tier };
    case 'SET_CAPABILITIES':
      return { ...state, capabilities: action.capabilities || {} };
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
    case 'SET_NOTIFICATIONS': {
      const notifs = (action.notifications || []).slice(0, 50);
      try {
        localStorage.setItem('learnflow-notifications', JSON.stringify(notifs));
      } catch {
        /* ignore */
      }
      return { ...state, notifications: notifs };
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
  // In dev auth bypass mode (Playwright, local demos), do not attempt refresh.
  // It causes confusing 401 redirects when there is no token.
  const runtimeEnv =
    (globalThis as any)?.__LEARNFLOW_ENV__ &&
    typeof (globalThis as any).__LEARNFLOW_ENV__ === 'object'
      ? (globalThis as any).__LEARNFLOW_ENV__
      : null;
  const devAuthBypass = runtimeEnv?.VITE_DEV_AUTH_BYPASS === '1';
  if (devAuthBypass) return;

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

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('learnflow-token');
  const origin = localStorage.getItem('learnflow-origin');

  const runtimeEnv =
    (globalThis as any)?.__LEARNFLOW_ENV__ &&
    typeof (globalThis as any).__LEARNFLOW_ENV__ === 'object'
      ? (globalThis as any).__LEARNFLOW_ENV__
      : null;
  const devAuthBypass = runtimeEnv?.VITE_DEV_AUTH_BYPASS === '1';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Iter137: E2E determinism — allow Playwright to request server-side fixtures for marketplace publish QC.
  // This is safe because the API also checks devMode before applying fixture behavior.
  if (
    runtimeEnv?.PLAYWRIGHT_E2E_FIXTURES === '1' ||
    runtimeEnv?.PLAYWRIGHT_E2E_FIXTURES === 'true'
  ) {
    headers['x-learnflow-e2e-fixtures'] = 'true';
  }

  // In dev bypass, avoid injecting Authorization header (it can trigger server auth flows).
  if (!devAuthBypass && token) headers['Authorization'] = `Bearer ${token}`;

  // Iter86: propagate origin tagging to the API so harness/screenshot runs can be excluded.
  if (origin) headers['x-learnflow-origin'] = origin;
  return headers;
}

export function apiBase(): string {
  // Prefer same-origin requests in real browser usage.
  // In tests (Vitest/jsdom) and in Node, default to the local API.
  const isVitest = typeof (globalThis as any).vi !== 'undefined';

  // Playwright determinism: allow overriding env via a runtime global so tests
  // don't depend on shell environment.
  const runtimeEnv =
    (globalThis as any)?.__LEARNFLOW_ENV__ &&
    typeof (globalThis as any).__LEARNFLOW_ENV__ === 'object'
      ? ((globalThis as any).__LEARNFLOW_ENV__ as Record<string, string | undefined>)
      : null;

  // Allow explicit override for E2E/CI (Vite) + Playwright runtime override.
  const envBase =
    runtimeEnv?.PLAYWRIGHT_BASE_URL ||
    runtimeEnv?.VITE_API_BASE_URL ||
    (import.meta as any)?.env?.VITE_API_BASE_URL;
  if (envBase) return String(envBase).replace(/\/$/, '');

  // In Vitest/jsdom, prefer relative to satisfy fetch stubs in tests.
  if (typeof window !== 'undefined' && isVitest) return '';

  // In local dev, the client runs on :3001 and the API on :3000.
  // Using same-origin would hit the Vite dev server and 404.
  if (typeof window !== 'undefined') {
    try {
      if (window.location.hostname === 'localhost' && window.location.port === '3001') {
        return 'http://localhost:3000';
      }
    } catch {
      // ignore
    }
    return '';
  }

  return 'http://localhost:3000';
}

export async function apiPost(path: string, body: unknown) {
  await refreshTokenIfNeeded();
  try {
    const res = await fetch(`${apiBase()}${API}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    // Subscription hydration immediate unlock:
    // if a subscription upgrade succeeds, re-fetch the tier so the UI unlocks instantly.
    // This keeps server as source of truth while avoiding page reloads.
    if (res.ok && path.startsWith('/subscription')) {
      try {
        const sub = await fetch(`${apiBase()}${API}/subscription`, {
          method: 'GET',
          headers: getAuthHeaders(),
        }).then((r) => r.json());
        if (sub?.tier) {
          // Notify the already-mounted AppProvider to update state immediately.
          // (Subscription is server-driven; we keep it in memory only.)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('learnflow:subscription', {
                detail: { tier: sub.tier, capabilities: sub.capabilities || {} },
              }),
            );
          }
        }
      } catch {
        // ignore
      }
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      if (res.status === 401) {
        console.warn('[LearnFlow] 401 — unauthorized');

        const runtimeEnv =
          (globalThis as any)?.__LEARNFLOW_ENV__ &&
          typeof (globalThis as any).__LEARNFLOW_ENV__ === 'object'
            ? (globalThis as any).__LEARNFLOW_ENV__
            : null;
        const devAuthBypass = runtimeEnv?.VITE_DEV_AUTH_BYPASS === '1';

        localStorage.removeItem('learnflow-token');
        localStorage.removeItem('learnflow-refresh');
        localStorage.removeItem('learnflow-user');

        if (!devAuthBypass) {
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
      }
      throw new Error(toActionableHttpErrorMessage(res.status, err, res));
    }
    return res.json();
  } catch (err) {
    console.error('[LearnFlow] apiPost error:', err);
    throw err;
  }
}

export async function apiDelete(path: string) {
  await refreshTokenIfNeeded();
  try {
    const headers = getAuthHeaders();
    const res = await fetch(`${apiBase()}${API}${path}`, { method: 'DELETE', headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      if (res.status === 401) {
        console.warn('[LearnFlow] 401 — unauthorized');

        const runtimeEnv =
          (globalThis as any)?.__LEARNFLOW_ENV__ &&
          typeof (globalThis as any).__LEARNFLOW_ENV__ === 'object'
            ? (globalThis as any).__LEARNFLOW_ENV__
            : null;
        const devAuthBypass = runtimeEnv?.VITE_DEV_AUTH_BYPASS === '1';

        localStorage.removeItem('learnflow-token');
        localStorage.removeItem('learnflow-refresh');
        localStorage.removeItem('learnflow-user');

        if (!devAuthBypass) {
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
      }
      throw new Error(toActionableHttpErrorMessage(res.status, err, res));
    }
    // 204 No Content
    return;
  } catch (err) {
    console.error('[LearnFlow] apiDelete error:', err);
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
      if (res.status === 401) {
        console.warn('[LearnFlow] 401 — unauthorized');

        const runtimeEnv =
          (globalThis as any)?.__LEARNFLOW_ENV__ &&
          typeof (globalThis as any).__LEARNFLOW_ENV__ === 'object'
            ? (globalThis as any).__LEARNFLOW_ENV__
            : null;
        const devAuthBypass = runtimeEnv?.VITE_DEV_AUTH_BYPASS === '1';

        localStorage.removeItem('learnflow-token');
        localStorage.removeItem('learnflow-refresh');
        localStorage.removeItem('learnflow-user');

        if (!devAuthBypass) {
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
      }
      throw new Error(toActionableHttpErrorMessage(res.status, err, res));
    }
    return res.json();
  } catch (err) {
    console.error('[LearnFlow] apiGet error:', err);
    throw err;
  }
}

export async function apiPut(path: string, body: unknown) {
  await refreshTokenIfNeeded();
  try {
    const res = await fetch(`${apiBase()}${API}${path}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      if (res.status === 401) {
        console.warn('[LearnFlow] 401 — unauthorized');

        const runtimeEnv =
          (globalThis as any)?.__LEARNFLOW_ENV__ &&
          typeof (globalThis as any).__LEARNFLOW_ENV__ === 'object'
            ? (globalThis as any).__LEARNFLOW_ENV__
            : null;
        const devAuthBypass = runtimeEnv?.VITE_DEV_AUTH_BYPASS === '1';

        localStorage.removeItem('learnflow-token');
        localStorage.removeItem('learnflow-refresh');
        localStorage.removeItem('learnflow-user');

        if (!devAuthBypass) {
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
      }
      throw new Error(toActionableHttpErrorMessage(res.status, err, res));
    }
    return res.json();
  } catch (err) {
    console.error('[LearnFlow] apiPut error:', err);
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
  deleteCourse: (courseId: string) => Promise<void>;
  apiGet: (path: string) => Promise<any>;
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
  const { toast } = useToast();

  // Hydrate Student Context + subscription state from server so it remains the source of truth
  // (not localStorage). Best-effort: only runs when authenticated.
  useEffect(() => {
    const token = localStorage.getItem('learnflow-token');
    if (!token) return;

    const onSub = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail || {};
        const tier = detail?.tier as SubscriptionTier | undefined;
        if (tier) dispatch({ type: 'SET_SUBSCRIPTION', tier });
        if (detail?.capabilities && typeof detail.capabilities === 'object') {
          dispatch({ type: 'SET_CAPABILITIES', capabilities: detail.capabilities });
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('learnflow:subscription', onSub as any);

    (async () => {
      // Student context hydration (goals/topics/experience + role/tier)
      try {
        const ctx = await apiGet('/profile/context');
        if (ctx) {
          dispatch({
            type: 'UPDATE_PROFILE',
            profile: {
              goals: Array.isArray(ctx.goals) ? ctx.goals : [],
              topics: Array.isArray(ctx.topics) ? ctx.topics : [],
              experience: ctx.experience || 'beginner',
            },
          });
          if (typeof ctx.subscriptionTier === 'string') {
            dispatch({ type: 'SET_SUBSCRIPTION', tier: ctx.subscriptionTier as SubscriptionTier });
          }
          // Persist full context (best-effort) for offline continuity.
          try {
            saveStudentContext({
              ...(loadStudentContext() || { goals: [], topics: [], experience: 'beginner' }),
              ...ctx,
            });
          } catch {
            /* ignore */
          }
        }
      } catch {
        // ignore
      }

      // Subscription hydration
      try {
        const sub = await apiGet('/subscription');
        if (sub?.tier) {
          dispatch({ type: 'SET_SUBSCRIPTION', tier: sub.tier });
        }
        if (sub?.capabilities && typeof sub.capabilities === 'object') {
          dispatch({ type: 'SET_CAPABILITIES', capabilities: sub.capabilities });
        }
      } catch {
        // ignore
      }

      // Pro Update Agent: hydrate durable notifications feed (best-effort)
      try {
        const n = await apiGet('/notifications?limit=50');
        if (Array.isArray(n?.notifications)) {
          const mapped = n.notifications.map((row: any) => ({
            id: String(row.id),
            type: (row.type as any) || 'system',
            message: String(row.title || row.body || ''),
            timestamp: row.createdAt || new Date().toISOString(),
            read: Boolean(row.readAt),
            meta: {
              topic: String(row.topic || ''),
              url: String(row.url || ''),
              sourceUrl: String(row.sourceUrl || ''),
              sourceDomain: String(row.sourceDomain || ''),
              checkedAt: row.checkedAt ? String(row.checkedAt) : null,
              explanation: String(row.explanation || ''),
            },
          }));
          dispatch({ type: 'SET_NOTIFICATIONS', notifications: mapped });
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      window.removeEventListener('learnflow:subscription', onSub as any);
    };
  }, []);

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
          meta: {
            generatedBy: data.agent || data.agent_name || data.generatedBy || undefined,
            sourcesCount: Array.isArray(data.sources) ? data.sources.length : undefined,
          },
        };
        dispatch({ type: 'ADD_CHAT_MESSAGE', message: assistantMsg });
      } catch (err: any) {
        const msg = String(err?.message || 'Sorry, something went wrong. Please try again.');
        if (/rate limit/i.test(msg) || /429/.test(msg)) {
          toast(msg, 'warning', 5000);
        } else {
          toast('Request failed. Please try again.', 'error');
        }

        const errMsg: ChatMessage = {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: msg,
          timestamp: new Date().toISOString(),
          meta: {
            generatedBy: 'system',
          },
        };
        dispatch({ type: 'ADD_CHAT_MESSAGE', message: errMsg });
      } finally {
        dispatch({ type: 'SET_LOADING', key: 'chat', value: false });
      }
    },
    [state.activeCourse, state.activeLesson, state.chat, toast],
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

  const deleteCourse = useCallback(
    async (courseId: string) => {
      dispatch({ type: 'SET_LOADING', key: 'deleteCourse', value: true });
      try {
        await apiDelete(`/courses/${courseId}`);
        // Remove locally and clear active course if needed
        const nextCourses = state.courses.filter((c) => c.id !== courseId);
        dispatch({ type: 'SET_COURSES', courses: nextCourses });
        if (state.activeCourse?.id === courseId) {
          dispatch({ type: 'SET_ACTIVE_COURSE', course: null });
          dispatch({ type: 'SET_ACTIVE_LESSON', lesson: null });
        }
      } finally {
        dispatch({ type: 'SET_LOADING', key: 'deleteCourse', value: false });
      }
    },
    [state.courses, state.activeCourse?.id],
  );

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
    deleteCourse,
    searchResearch,
    addTopicToCourse,
    apiGet,
    webSearch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
