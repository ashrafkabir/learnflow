/**
 * JSON-file persistence layer for courses, lessons, and progress.
 * Survives API restarts. Writes atomically via rename.
 */
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ─── Courses ───

export interface PersistedCourse {
  id: string;
  title: string;
  description: string;
  topic: string;
  depth: string;
  authorId: string;
  modules: any[];
  progress: Record<string, number>;
  createdAt: string;
}

export function loadCourses(): Map<string, PersistedCourse> {
  ensureDir();
  try {
    if (fs.existsSync(COURSES_FILE)) {
      const data = JSON.parse(fs.readFileSync(COURSES_FILE, 'utf-8'));
      return new Map(Object.entries(data));
    }
  } catch (err) {
    console.warn('[Persistence] Failed to load courses:', err);
  }
  return new Map();
}

export function saveCourses(courses: Map<string, PersistedCourse>): void {
  ensureDir();
  const obj: Record<string, PersistedCourse> = {};
  for (const [k, v] of courses) obj[k] = v;
  const tmp = COURSES_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, COURSES_FILE);
}

// ─── Lesson Completion (per-user per-lesson) ───

export interface LessonProgress {
  [userId: string]: {
    [courseId: string]: string[]; // array of completed lessonIds
  };
}

export function loadProgress(): LessonProgress {
  ensureDir();
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('[Persistence] Failed to load progress:', err);
  }
  return {};
}

export function saveProgress(progress: LessonProgress): void {
  ensureDir();
  const tmp = PROGRESS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(progress, null, 2));
  fs.renameSync(tmp, PROGRESS_FILE);
}

export function markLessonComplete(
  progress: LessonProgress,
  userId: string,
  courseId: string,
  lessonId: string,
): void {
  if (!progress[userId]) progress[userId] = {};
  if (!progress[userId][courseId]) progress[userId][courseId] = [];
  if (!progress[userId][courseId].includes(lessonId)) {
    progress[userId][courseId].push(lessonId);
  }
  saveProgress(progress);
}

export function getCompletedLessons(
  progress: LessonProgress,
  userId: string,
  courseId: string,
): string[] {
  return progress[userId]?.[courseId] || [];
}

export function getUserStats(progress: LessonProgress, userId: string) {
  const userProgress = progress[userId] || {};
  let totalLessons = 0;
  const _completionDates: string[] = []; // placeholder (dates not tracked yet)
  for (const courseId of Object.keys(userProgress)) {
    totalLessons += userProgress[courseId].length;
  }
  return {
    totalCoursesEnrolled: Object.keys(userProgress).length,
    totalLessonsCompleted: totalLessons,
    // Estimate study minutes (5 min per lesson average)
    totalStudyMinutes: totalLessons * 5,
    currentStreak: Math.min(totalLessons, 30), // simple heuristic
  };
}
