import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.js';

export function CourseView() {
  const { courseId } = useParams();
  const nav = useNavigate();
  const { state, fetchCourse } = useApp();
  const [expandedModule, setExpandedModule] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const course = state.activeCourse;

  useEffect(() => {
    if (courseId && (!course || course.id !== courseId)) {
      setLoading(true);
      fetchCourse(courseId).finally(() => setLoading(false));
    }
  }, [courseId]);

  // Auto-expand first module
  useEffect(() => {
    if (course?.modules?.[0] && !expandedModule) {
      setExpandedModule(course.modules[0].id);
    }
  }, [course]);

  if (loading || !course) {
    return (
      <section
        data-screen="course-view"
        aria-label="Course View"
        className="min-h-screen bg-gray-50 dark:bg-bg-dark flex items-center justify-center"
      >
        <div className="text-center space-y-3">
          <div className="animate-spin text-4xl">⏳</div>
          <p className="text-gray-500">Loading course...</p>
        </div>
      </section>
    );
  }

  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const completed = course.modules.reduce(
    (s, m) => s + m.lessons.filter((l) => state.completedLessons.has(l.id)).length,
    0,
  );
  const pct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

  return (
    <section
      aria-label="Course View"
      data-screen="course-view"
      className="min-h-screen bg-gray-50 dark:bg-bg-dark"
    >
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-900 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => nav('/dashboard')}
            className="text-primary-200 hover:text-white mb-4 inline-flex items-center gap-1 text-sm transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{course.title}</h1>
          <p className="text-primary-200 text-sm mb-4">{course.description}</p>

          {/* Progress */}
          <div data-component="progress-tracker" aria-label={`Course progress: ${pct}%`}>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-primary-200">
                {completed}/{totalLessons} lessons completed
              </span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Syllabus */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Course Syllabus
        </h2>
        <div data-component="syllabus" aria-label="Course syllabus" className="space-y-3">
          {course.modules.map((mod, mi) => (
            <div
              key={mod.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <button
                onClick={() => setExpandedModule(expandedModule === mod.id ? '' : mod.id)}
                aria-expanded={expandedModule === mod.id}
                className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-accent/10 text-accent text-sm font-bold flex items-center justify-center">
                    {mi + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {mod.objective} · {mod.lessons.length} lessons
                    </p>
                  </div>
                </div>
                <span
                  className="text-gray-400 text-lg transition-transform"
                  style={{ transform: expandedModule === mod.id ? 'rotate(180deg)' : '' }}
                >
                  ▼
                </span>
              </button>
              {expandedModule === mod.id && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                  {mod.lessons.map((lesson, li) => {
                    const isComplete = state.completedLessons.has(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        role="article"
                        aria-label={lesson.title}
                        onClick={() => nav(`/courses/${courseId}/lessons/${lesson.id}`)}
                        className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isComplete ? 'bg-success text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                        >
                          {isComplete ? '✓' : li + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {lesson.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{lesson.description}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {lesson.estimatedTime} min
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
