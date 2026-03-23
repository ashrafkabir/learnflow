import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.js';
import { Button } from '../components/Button.js';
import { SkeletonCourseView } from '../components/Skeleton.js';
import { CitationTooltip, type Source } from '../components/CitationTooltip.js';
import { mergeUniqueSources, parseSources } from '../lib/sources.js';
import {
  IconBook,
  IconCelebrate,
  IconCheck,
  IconChart,
  IconClipboard,
  IconCourse,
  IconLesson,
  IconX,
  IconTestTube,
} from '../components/icons/index.js';

/* Estimate read time from lesson description length and estimatedTime */
function estimateReadTime(lesson: { estimatedTime?: number; description?: string }): number {
  if (lesson.estimatedTime) return lesson.estimatedTime;
  const words = (lesson.description || '').split(/\s+/).length;
  return Math.max(2, Math.round(words / 200));
}

export function CourseView() {
  const { courseId } = useParams();
  const nav = useNavigate();
  const { state, fetchCourse, completeLesson } = useApp();
  const [expandedModule, setExpandedModule] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<{
    id: string;
    title: string;
    courseId: string;
  } | null>(null);

  const course = state.activeCourse;

  useEffect(() => {
    if (courseId && (!course || course.id !== courseId)) {
      setLoading(true);
      setError('');
      fetchCourse(courseId)
        .catch((e) => setError(e?.message || 'Failed to load course'))
        .finally(() => setLoading(false));
    }
  }, [courseId]);

  // Auto-expand first module
  useEffect(() => {
    if (course?.modules?.[0] && !expandedModule) {
      setExpandedModule(course.modules[0].id);
    }
  }, [course]);

  if (error) {
    return (
      <section
        data-screen="course-view"
        className="min-h-screen bg-bg dark:bg-bg-dark flex items-center justify-center"
      >
        <div className="text-center space-y-3 max-w-sm">
          <span className="text-red-600 dark:text-red-400">
            <IconX className="w-10 h-10" />
          </span>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Failed to load course</p>
          <p className="text-sm text-gray-500">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="primary"
              onClick={() => {
                setError('');
                setLoading(true);
                fetchCourse(courseId!)
                  .catch((e) => setError(e?.message))
                  .finally(() => setLoading(false));
              }}
            >
              Retry
            </Button>
            <Button variant="secondary" onClick={() => nav('/dashboard')}>
              Back
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (loading || !course) {
    return (
      <section
        data-screen="course-view"
        aria-label="Course View"
        className="min-h-screen bg-bg dark:bg-bg-dark"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <SkeletonCourseView />
        </div>
      </section>
    );
  }

  const modules = course.modules ?? [];
  const totalLessons = modules.reduce((s, m) => s + (m.lessons?.length ?? 0), 0);
  const completed = modules.reduce(
    (s, m) => s + (m.lessons ?? []).filter((l) => state.completedLessons.has(l.id)).length,
    0,
  );
  const pct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

  const sources: Source[] = mergeUniqueSources(
    modules.flatMap((m) => (m.lessons ?? []).flatMap((l) => parseSources(l.content))),
  );

  return (
    <section
      aria-label="Course View"
      data-screen="course-view"
      className="min-h-screen bg-bg dark:bg-bg-dark"
    >
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-900 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => nav('/dashboard')}
            className="text-primary-200 hover:text-white mb-4 border-0"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{course.title}</h1>
          <p className="text-primary-200 text-sm mb-4">{course.description}</p>

          {/* Progress */}
          <div
            data-component="progress-tracker"
            aria-label={`Course progress: ${pct}%`}
            className="flex items-center gap-4"
          >
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-primary-200">
                  {completed}/{totalLessons} lessons completed
                </span>
                <span className="font-semibold">{pct}%</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {pct > 0 && pct < 100 && (
                <p className="text-xs text-primary-300 mt-1.5">
                  {totalLessons - completed} lesson{totalLessons - completed !== 1 ? 's' : ''}{' '}
                  remaining
                </p>
              )}
              {pct === 100 && (
                <p className="text-xs text-green-300 mt-1.5 font-medium inline-flex items-center gap-1">
                  <IconCelebrate className="w-4 h-4" />
                  Course complete!
                </p>
              )}
            </div>
            {/* Circular progress indicator */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${pct}, 100`}
                  className="text-accent transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                {pct}%
              </span>
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
          {modules.map((mod, mi) => (
            <div
              key={mod.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card overflow-hidden"
            >
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setExpandedModule(expandedModule === mod.id ? '' : mod.id)}
                aria-expanded={expandedModule === mod.id}
                className="px-5 py-4 text-left justify-between h-auto rounded-none"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-accent/10 text-accent text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {mi + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">
                      {mod.objective} ·{' '}
                      {(mod.lessons ?? []).filter((l) => state.completedLessons.has(l.id)).length}/
                      {(mod.lessons ?? []).length} lessons
                    </p>
                    <div className="mt-1.5 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{
                          width: `${(mod.lessons ?? []).length > 0 ? Math.round(((mod.lessons ?? []).filter((l) => state.completedLessons.has(l.id)).length / (mod.lessons ?? []).length) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <span
                  className="text-gray-500 dark:text-gray-300 text-lg transition-transform"
                  style={{ transform: expandedModule === mod.id ? 'rotate(180deg)' : '' }}
                >
                  ▾
                </span>
              </Button>
              {expandedModule === mod.id && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                  {(mod.lessons ?? []).map((lesson, li) => {
                    const isComplete = state.completedLessons.has(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        role="article"
                        aria-label={lesson.title}
                        onClick={() => {
                          setSelectedLesson({
                            id: lesson.id,
                            title: lesson.title,
                            courseId: courseId!,
                          });
                          nav(`/courses/${courseId}/lessons/${lesson.id}`);
                        }}
                        className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0"
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isComplete ? 'bg-success text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                        >
                          {isComplete ? <IconCheck className="w-3.5 h-3.5" /> : li + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {lesson.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-300 truncate">
                            {lesson.description}
                            {/* Inline citation hover previews — Spec §5.2.4 */}
                            {li < sources.length && (
                              <span className="inline-flex ml-1 align-middle">
                                <CitationTooltip num={sources[li].id} source={sources[li]} />
                              </span>
                            )}
                          </p>
                        </div>
                        {/* Read time estimate badge */}
                        <span
                          className="text-xs text-gray-500 dark:text-gray-300 whitespace-nowrap mr-2 flex items-center gap-1"
                          title={`Estimated read time: ~${estimateReadTime(lesson)} min`}
                        >
                          <IconBook className="w-4 h-4" /> ~{estimateReadTime(lesson)} min
                        </span>
                        <Button
                          variant={isComplete ? 'ghost' : 'primary'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            nav(`/courses/${courseId}/lessons/${lesson.id}`);
                          }}
                          className={
                            isComplete ? 'bg-success/10 text-success hover:bg-success/20' : ''
                          }
                        >
                          {isComplete ? 'Review' : 'Start'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Course Stats & Sources — Spec §5.2.4 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <span className="text-accent block mb-1 inline-flex justify-center">
              <IconCourse className="w-7 h-7" />
            </span>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{modules.length}</p>
            <p className="text-xs text-gray-500">Modules</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <span className="text-accent block mb-1 inline-flex justify-center">
              <IconLesson className="w-7 h-7" />
            </span>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalLessons}</p>
            <p className="text-xs text-gray-500">Total Lessons</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <span className="text-accent block mb-1 inline-flex justify-center">
              <IconChart className="w-7 h-7" />
            </span>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {modules.reduce(
                (s, m) => s + (m.lessons ?? []).reduce((ls, l) => ls + estimateReadTime(l), 0),
                0,
              )}
            </p>
            <p className="text-xs text-gray-500">Total Minutes</p>
          </div>
        </div>

        {/* Module Progress Overview */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Module Progress
          </h3>
          <div className="space-y-3">
            {modules.map((mod, mi) => {
              const modLessons = mod.lessons ?? [];
              const modCompleted = modLessons.filter((l) =>
                state.completedLessons.has(l.id),
              ).length;
              const modPct =
                modLessons.length > 0 ? Math.round((modCompleted / modLessons.length) * 100) : 0;
              return (
                <div key={mod.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-accent/10 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {mi + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 dark:text-gray-300 truncate">{mod.title}</span>
                      <span className="text-gray-500 ml-2">
                        {modCompleted}/{modLessons.length}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${modPct === 100 ? 'bg-success' : 'bg-accent'}`}
                        style={{ width: `${modPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Source References */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 inline-flex items-center gap-2">
            <IconClipboard className="w-5 h-5 text-accent" />
            Sources & References
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            This course draws from the following research and materials. Hover over inline citations
            for previews.
          </p>
          <div className="space-y-2">
            {sources.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No sources found for this course yet.
              </p>
            ) : (
              sources.map((src) => (
                <div key={src.id} className="flex items-start gap-2 text-sm">
                  <span className="text-accent font-semibold">[{src.id}]</span>
                  <div className="min-w-0">
                    <a
                      className="text-gray-900 dark:text-white font-medium hover:underline"
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {src.title}
                    </a>
                    <span className="text-gray-500 dark:text-gray-400">
                      {' '}
                      — {src.author}
                      {src.publication ? ` · ${src.publication}` : ''} ({src.year})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar — Spec §5.2.4 */}
      {selectedLesson && (
        <div className="sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-modal">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-around gap-2">
            <Button
              variant={state.completedLessons.has(selectedLesson.id) ? 'ghost' : 'primary'}
              size="sm"
              onClick={async () => {
                try {
                  await completeLesson(selectedLesson.courseId, selectedLesson.id);
                } catch {
                  // best-effort; errors show via other UI surfaces
                }
              }}
              className={
                state.completedLessons.has(selectedLesson.id)
                  ? 'bg-success/10 text-success hover:bg-success/20'
                  : ''
              }
            >
              <span className="inline-flex items-center gap-2">
                <IconCheck className="w-4 h-4" />
                {state.completedLessons.has(selectedLesson.id) ? 'Completed' : 'Mark Complete'}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                nav(
                  `/conversation?courseId=${selectedLesson.courseId}&lessonId=${selectedLesson.id}&action=quiz`,
                )
              }
            >
              <span className="inline-flex items-center gap-2">
                <IconTestTube className="w-4 h-4" />
                Quiz Me
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                nav(
                  `/conversation?courseId=${selectedLesson.courseId}&lessonId=${selectedLesson.id}&action=notes`,
                )
              }
            >
              <span className="inline-flex items-center gap-2">
                <IconLesson className="w-4 h-4" />
                Take Notes
              </span>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
