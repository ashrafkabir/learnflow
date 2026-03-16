import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware.js';

const router = Router();

// In-memory store (replaced by DB later)
interface Course {
  id: string;
  title: string;
  description: string;
  authorId: string;
  lessons: Array<{ id: string; title: string; content: string }>;
  progress: Record<string, number>;
}
const courses: Map<string, Course> = new Map();

const createCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  topic: z.string(),
});

// GET /api/v1/courses - List user's enrolled courses
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const userCourses = Array.from(courses.values()).filter(
    (c) => c.authorId === userId || c.progress[userId] !== undefined,
  );
  res.status(200).json({ courses: userCourses });
});

// POST /api/v1/courses - Create new course
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const parse = createCourseSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'validation_error', message: parse.error.message, code: 400 });
    return;
  }

  const { title, description, topic } = parse.data;
  const course: Course = {
    id: `course-${Date.now()}`,
    title,
    description: description || `A course about ${topic}`,
    authorId: req.user!.sub,
    lessons: [
      { id: 'lesson-1', title: `Introduction to ${topic}`, content: 'Welcome to the course.' },
    ],
    progress: {},
  };
  courses.set(course.id, course);

  res.status(201).json(course);
});

// GET /api/v1/courses/:id - Get course detail
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const course = courses.get(req.params.id);
  if (!course) {
    res.status(404).json({ error: 'not_found', message: 'Course not found', code: 404 });
    return;
  }
  res.status(200).json(course);
});

// GET /api/v1/courses/:id/lessons/:lessonId - Get lesson
router.get('/:id/lessons/:lessonId', authMiddleware, (req: Request, res: Response) => {
  const course = courses.get(req.params.id);
  if (!course) {
    res.status(404).json({ error: 'not_found', message: 'Course not found', code: 404 });
    return;
  }
  const lesson = course.lessons.find((l) => l.id === req.params.lessonId);
  if (!lesson) {
    res.status(404).json({ error: 'not_found', message: 'Lesson not found', code: 404 });
    return;
  }
  res.status(200).json(lesson);
});

// POST /api/v1/courses/:id/lessons/:lessonId/complete - Mark lesson complete
router.post('/:id/lessons/:lessonId/complete', authMiddleware, (req: Request, res: Response) => {
  const course = courses.get(req.params.id);
  if (!course) {
    res.status(404).json({ error: 'not_found', message: 'Course not found', code: 404 });
    return;
  }
  const userId = req.user!.sub;
  const completedCount = (course.progress[userId] || 0) + 1;
  course.progress[userId] = completedCount;
  res.status(200).json({ message: 'Lesson marked complete', progress: completedCount });
});

export const coursesRouter = router;
export { courses }; // Export for testing
