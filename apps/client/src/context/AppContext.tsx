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

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  estimatedTime: number;
  wordCount: number;
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
  | { type: 'UPDATE_PROFILE'; profile: Partial<UserProfile> };

const initialState: AppState = {
  onboarding: { completed: false, step: 0, goals: [], topics: [], experience: '' },
  courses: [],
  activeCourse: null,
  activeLesson: null,
  chat: [],
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
  streak: 7,
  completedLessons: new Set(),
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
      return { ...state, onboarding: { ...state.onboarding, completed: true } };
    case 'SET_COURSES':
      return { ...state, courses: action.courses };
    case 'ADD_COURSE':
      return { ...state, courses: [...state.courses, action.course] };
    case 'SET_ACTIVE_COURSE':
      return { ...state, activeCourse: action.course };
    case 'SET_ACTIVE_LESSON':
      return { ...state, activeLesson: action.lesson };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chat: [...state.chat, action.message] };
    case 'SET_CHAT':
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
    default:
      return state;
  }
}

// API helpers
const API = '/api/v1';

async function apiPost(path: string, body: unknown) {
  try {
    const base =
      typeof window !== 'undefined' && window.location?.origin !== 'null'
        ? ''
        : 'http://localhost:3002';
    const res = await fetch(`${base}${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  } catch {
    return {};
  }
}

async function apiGet(path: string) {
  try {
    const base =
      typeof window !== 'undefined' && window.location?.origin !== 'null'
        ? ''
        : 'http://localhost:3002';
    const res = await fetch(`${base}${API}${path}`);
    return res.json();
  } catch {
    return {};
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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const createCourse = useCallback(async (topic: string): Promise<Course> => {
    dispatch({ type: 'SET_LOADING', key: 'createCourse', value: true });
    try {
      const course = await apiPost('/courses', { topic });
      dispatch({ type: 'ADD_COURSE', course });
      dispatch({ type: 'SET_ACTIVE_COURSE', course });
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

  const sendChat = useCallback(async (message: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CHAT_MESSAGE', message: userMsg });
    dispatch({ type: 'SET_LOADING', key: 'chat', value: true });
    try {
      const data = await apiPost('/chat', { message, history: [] });
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-reply`,
        role: 'assistant',
        content: data.reply || data.message || 'I can help you with that!',
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_CHAT_MESSAGE', message: assistantMsg });
    } finally {
      dispatch({ type: 'SET_LOADING', key: 'chat', value: false });
    }
  }, []);

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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
