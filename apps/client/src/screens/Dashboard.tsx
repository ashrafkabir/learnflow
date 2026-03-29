import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, apiGet } from '../context/AppContext.js';
import { ProgressRing } from '../components/ProgressRing.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { useStartPipeline, usePipelineList } from '../hooks/usePipeline.js';
import { useTheme } from '../design-system/ThemeProvider.js';
import { PipelineView } from '../components/pipeline/PipelineView.js';
import { usePipeline } from '../hooks/usePipeline.js';
import { Button } from '../components/Button.js';
import { useBookmarks } from '../hooks/useBookmarks.js';
import { useToast } from '../components/Toast.js';
import { SkeletonDashboard } from '../components/Skeleton.js';
import { OnboardingTooltips } from '../components/OnboardingTooltips.js';
import {
  IconBrainSpark,
  IconChatTutor,
  IconCourse,
  IconLesson,
  IconMarketplace,
  IconMindmap,
  IconPipeline,
  IconProgressRing,
  IconSearch,
  IconSettings,
  IconShieldKey,
  IconSpark,
  IconCelebrate,
  IconCalendar,
  IconClose,
  IconTrash,
  IconFlame,
  IconMap,
  IconRocket,
  IconSparkles,
} from '../components/icons/index.js';

export function Dashboard() {
  const nav = useNavigate();
  const { toast } = useToast();
  const { state, dispatch, deleteCourse } = useApp();
  const [newTopic, setNewTopic] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<null | { id: string; title: string }>(null);
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<Array<{ day: string; minutes: number }>>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const { start: startPipeline, loading: pipelineLoading } = useStartPipeline();
  const { pipelines: pipelineList, refresh: refreshPipelines } = usePipelineList();
  const { state: activePipelineState } = usePipeline(activePipelineId);
  const { bookmarks, remove: removeBookmark } = useBookmarks();

  const FREE_COURSE_LIMIT = 3;
  const canCreateCourse = state.subscription === 'pro' || state.courses.length < FREE_COURSE_LIMIT;

  const handleCreateCourse = async () => {
    if (!newTopic.trim()) return;
    if (!canCreateCourse) {
      setUpgradeMessage('Free plan is limited to 3 courses. Upgrade to Pro for unlimited courses.');
      return;
    }
    setUpgradeMessage(null);
    setCreating(true);
    try {
      const result = await startPipeline(newTopic.trim());
      if (result) {
        setActivePipelineId(result.pipelineId);
        refreshPipelines();
        // Happy path: take the user directly to their new course.
        nav(`/courses/${result.courseId}`);
      }
    } catch (err: any) {
      // Show the real reason (auth, tier limit, server error) instead of failing silently.
      const msg = String(err?.message || '').trim();
      toast(msg || 'Could not start course creation. Please try again.', 'error');
    } finally {
      setCreating(false);
      setNewTopic('');
    }
  };

  // Fetch analytics on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet('/analytics');
        dispatch({
          type: 'SET_ANALYTICS',
          streak: data.currentStreak || 0,
          totalStudyMinutes: data.totalStudyMinutes || 0,
          totalLessonsCompleted: data.totalLessonsCompleted || 0,
        });
        if (data.weeklyProgress) setWeeklyData(data.weeklyProgress);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // Fetch courses on mount
  useEffect(() => {
    (async () => {
      setInitialLoading(true);
      try {
        const data = await apiGet('/courses');
        if (data.courses && data.courses.length > 0) {
          const fullCourses = await Promise.all(
            data.courses.map(async (c: { id: string }) => {
              try {
                return await apiGet(`/courses/${c.id}`);
              } catch {
                return null;
              }
            }),
          );
          const valid = fullCourses.filter(Boolean);
          if (valid.length > 0) dispatch({ type: 'SET_COURSES', courses: valid });
        }
      } catch {
        /* ignore */
      } finally {
        setInitialLoading(false);
      }
    })();
  }, []);

  // Refresh pipelines periodically
  useEffect(() => {
    const interval = setInterval(refreshPipelines, 5000);
    return () => clearInterval(interval);
  }, [refreshPipelines]);

  // Fetch courses when a pipeline completes
  useEffect(() => {
    if (activePipelineState?.stage === 'reviewing') {
      const fetchNewCourse = async () => {
        try {
          const data = await apiGet('/courses');
          if (data.courses) {
            for (const c of data.courses) {
              try {
                const course = await apiGet(`/courses/${c.id}`);
                dispatch({ type: 'ADD_COURSE', course });
              } catch {
                /* ignore */
              }
            }
          }
        } catch {
          /* ignore */
        }
      };
      fetchNewCourse();
    }
  }, [activePipelineState?.stage]);

  const { mode: themeMode, toggle: toggleDarkMode } = useTheme();

  // Today's lessons (API-driven)
  const [todaysLessons, setTodaysLessons] = useState<
    Array<{
      courseId: string;
      courseTitle: string;
      lessonId: string;
      lessonTitle: string;
      estimatedTime: number;
      reason?: string;
    }>
  >([]);
  const [todaysLimit, setTodaysLimit] = useState<number>(3);
  const [todaysUnavailable, setTodaysUnavailable] = useState(false);

  useEffect(() => {
    (async () => {
      setTodaysUnavailable(false);
      try {
        const data = await apiGet('/daily?limit=3');
        if (typeof data?.limit === 'number') setTodaysLimit(data.limit);
        if (Array.isArray(data?.lessons)) setTodaysLessons(data.lessons);
      } catch {
        setTodaysUnavailable(true);
        setTodaysLessons([]);
      }
    })();
  }, [state.courses.length, state.completedLessons.size]);

  return (
    <section
      aria-label="Dashboard"
      data-screen="dashboard"
      className="min-h-screen bg-bg dark:bg-bg-dark"
    >
      <OnboardingTooltips />
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-accent" aria-hidden>
              <IconBrainSpark size={22} />
            </span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              LearnFlow
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {themeMode === 'dark' ? (
                <IconSpark size={20} title="Light mode" decorative={false} />
              ) : (
                <IconSpark size={20} title="Dark mode" decorative={false} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => nav('/conversation')}
              aria-label="Chat"
            >
              <IconChatTutor size={20} title="Chat" decorative={false} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => nav('/settings')}
              aria-label="Settings"
            >
              <IconSettings size={20} title="Settings" decorative={false} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Skeleton loading state */}
        {initialLoading ? (
          <SkeletonDashboard />
        ) : (
          <>
            {/* Hero CTA */}
            {todaysLessons.length > 0 ? (
              <div className="bg-gradient-to-r from-accent to-accent-dark rounded-2xl p-6 sm:p-8 text-white shadow-card">
                <p className="text-sm font-medium opacity-80 mb-1">Continue Learning</p>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">
                  {todaysLessons[0].lessonTitle}
                </h2>
                <p className="text-sm opacity-75 mb-4">
                  {todaysLessons[0].courseTitle} · {todaysLessons[0].estimatedTime} min
                </p>
                <Button
                  onClick={() =>
                    nav(
                      `/courses/${todaysLessons[0].courseId}/lessons/${todaysLessons[0].lessonId}`,
                    )
                  }
                  variant="secondary"
                  className="bg-white text-accent hover:bg-white/90 border-0 shadow-card"
                >
                  Resume →
                </Button>
              </div>
            ) : state.courses.length === 0 ? (
              <div className="bg-gradient-to-r from-accent to-accent-dark rounded-2xl p-6 sm:p-8 text-white shadow-card">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Start Your Learning Journey</h2>
                <p className="text-sm opacity-80 mb-4">
                  Enter any topic and our AI agents will build a course outline and draft lessons
                  for you in minutes (best-effort; may be incomplete in this MVP).
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Agentic AI', 'Rust Programming', 'Quantum Computing'].map((t) => (
                    <Button
                      key={t}
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewTopic(t)}
                      className="text-white bg-white/20 hover:bg-white/30 border-0"
                    >
                      {t}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    const el = document.querySelector<HTMLInputElement>(
                      'input[placeholder*="Enter a topic"]',
                    );
                    el?.focus();
                  }}
                  variant="secondary"
                  className="bg-white text-accent hover:bg-white/90 border-0 shadow-card"
                >
                  Create Your First Course
                </Button>
              </div>
            ) : null}

            {/* Bookmarks */}
            {bookmarks.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-5 card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bookmarks</h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {bookmarks.length} saved
                  </span>
                </div>
                <div className="space-y-2">
                  {bookmarks.slice(0, 5).map((b) => (
                    <div
                      key={b.lessonId}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          Lesson: {b.lessonId}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          Course: {b.courseId}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => nav(`/courses/${b.courseId}/lessons/${b.lessonId}`)}
                        >
                          Open
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            removeBookmark(b.lessonId).catch(() => {
                              toast('Could not remove bookmark. Please try again.', 'error');
                            })
                          }
                          aria-label="Remove bookmark"
                        >
                          <IconTrash size={16} decorative />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Streak & Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                data-component="streak-tracker"
                aria-label="Learning streak"
                className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-4 text-white card stat-animate"
              >
                <p className="text-sm font-medium opacity-90">Streak</p>
                <p className="text-3xl font-bold flex items-center gap-2">
                  <span className="flame-flicker" aria-hidden>
                    <IconFlame size={22} className="text-white" decorative />
                  </span>
                  {state.streak}
                </p>
                <p className="text-xs opacity-75 mt-1">days in a row</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-card card stat-animate stat-animate-delay-1">
                <p className="text-sm text-gray-800/80 dark:text-gray-200">Courses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {state.courses.length}
                </p>
                <p className="text-xs text-gray-800/80 dark:text-gray-200 mt-1">active</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-card card stat-animate stat-animate-delay-2">
                <p className="text-sm text-gray-800/80 dark:text-gray-200">Completed</p>
                <p className="text-3xl font-bold text-success">{state.completedLessons.size}</p>
                <p className="text-xs text-gray-800/80 dark:text-gray-200 mt-1">lessons</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-card card stat-animate stat-animate-delay-3">
                <p className="text-sm text-gray-800/80 dark:text-gray-200">Today</p>
                <p className="text-3xl font-bold text-accent">
                  {todaysUnavailable ? '—' : `${todaysLessons.length}/${todaysLimit}`}
                </p>
                <p className="text-xs text-gray-800/80 dark:text-gray-200 mt-1">
                  {todaysUnavailable ? 'unavailable (MVP)' : 'daily goal'}
                </p>
              </div>
            </div>

            {/* Review Queue */}
            {state.completedLessons.size > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-5 card">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Review Queue
                  </h2>
                  <span className="bg-accent/10 text-accent text-xs font-bold px-2 py-0.5 rounded-full">
                    {Math.min(state.completedLessons.size, 3)} due
                  </span>
                </div>
                <p className="text-sm text-gray-800/80 dark:text-gray-200 mb-3">
                  Spaced repetition keeps knowledge fresh. Review these lessons today.
                </p>
                <div className="space-y-2">
                  {state.courses.slice(0, 2).flatMap((c) =>
                    (c.modules || [])
                      .flatMap((m) => m.lessons || [])
                      .filter((l: { id: string; title: string }) =>
                        state.completedLessons.has(l.id),
                      )
                      .slice(0, 2)
                      .map((l: { id: string; title: string }) => (
                        <Button
                          key={l.id}
                          variant="ghost"
                          fullWidth
                          onClick={() => {
                            nav(`/courses/${c.id}/lessons/${l.id}`);
                          }}
                          className="justify-start text-left px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                        >
                          <span className="font-medium text-gray-900 dark:text-white inline-flex items-center gap-2">
                            <span className="text-accent" aria-hidden>
                              <IconPipeline size={16} />
                            </span>
                            {l.title}
                          </span>
                          <span className="text-gray-800/80 dark:text-gray-200 ml-2">
                            — Review due
                          </span>
                        </Button>
                      )),
                  )}
                </div>
              </div>
            )}

            {/* Weekly Progress Chart */}
            {weeklyData.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  This Week
                </h2>
                {(() => {
                  const maxMin = Math.max(...weeklyData.map((d) => d.minutes), 1);
                  const hasData = weeklyData.some((d) => d.minutes > 0);
                  if (!hasData)
                    return (
                      <div className="text-center py-6">
                        <div className="flex items-end justify-center gap-2 h-20 mb-4 opacity-20">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                            <div key={d + i} className="flex-1 max-w-8">
                              <div
                                className="bg-gray-300 dark:bg-gray-600 rounded-t-md"
                                style={{ height: `${20 + Math.random() * 40}px` }}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-800/80 dark:text-gray-200 mb-3">
                          No activity yet this week
                        </p>
                        {todaysLessons.length > 0 ? (
                          <Button
                            variant="ghost"
                            onClick={() =>
                              nav(
                                `/courses/${todaysLessons[0].courseId}/lessons/${todaysLessons[0].lessonId}`,
                              )
                            }
                            className="text-accent"
                          >
                            Complete your first lesson to see activity here →
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              const el = document.querySelector<HTMLInputElement>(
                                'input[placeholder*="Enter a topic"]',
                              );
                              el?.focus();
                            }}
                            className="text-accent"
                          >
                            Create a course to get started →
                          </Button>
                        )}
                      </div>
                    );
                  return (
                    <div className="flex items-end gap-2 h-32">
                      {weeklyData.map((d) => (
                        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] text-gray-800/80 dark:text-gray-200">
                            {d.minutes > 0 ? `${d.minutes}m` : ''}
                          </span>
                          <div
                            className="w-full flex flex-col justify-end"
                            style={{ height: '80px' }}
                          >
                            <div
                              className="w-full bg-accent/80 rounded-t-md transition-all duration-500"
                              style={{
                                height: `${Math.max((d.minutes / maxMin) * 100, d.minutes > 0 ? 8 : 0)}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-800/80 dark:text-gray-200 font-medium">
                            {d.day}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Today's Lessons */}
            {todaysLessons.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 inline-flex items-center gap-2">
                  <IconCalendar size={18} className="text-accent" decorative />
                  Today's Lessons
                </h2>
                <div className="space-y-2">
                  {todaysLessons.map((tl, i) => (
                    <Button
                      key={tl.lessonId}
                      variant="ghost"
                      fullWidth
                      onClick={() => nav(`/courses/${tl.courseId}/lessons/${tl.lessonId}`)}
                      className="justify-start text-left gap-3 p-3 h-auto"
                    >
                      <span className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-sm flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {tl.lessonTitle}
                        </p>
                        <p className="text-xs text-gray-800/80 dark:text-gray-200 truncate">
                          {tl.courseTitle} · {tl.estimatedTime} min
                          {tl.reason ? ` · ${tl.reason}` : ''}
                        </p>
                      </div>
                      <span className="text-gray-300 dark:text-gray-600">→</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* New Course */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Start Learning Something New
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                {upgradeMessage && (
                  <div className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
                    <div className="flex items-center justify-between gap-3">
                      <span>{upgradeMessage}</span>
                      <Button variant="secondary" size="sm" onClick={() => nav('/pricing')}>
                        View plans
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateCourse()}
                  placeholder="Enter a topic (e.g., Agentic AI, Rust, Quantum Computing)..."
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                />
                <Button
                  onClick={handleCreateCourse}
                  disabled={creating || pipelineLoading || !newTopic.trim()}
                  variant="primary"
                  size="large"
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-2">
                    <IconSparkles size={16} className="text-white" decorative />
                    {creating || pipelineLoading ? 'Starting...' : 'Create Course'}
                  </span>
                </Button>
              </div>
            </div>

            {/* Active Pipeline with Live indicator */}
            {activePipelineState &&
              activePipelineState.stage !== 'reviewing' &&
              activePipelineState.stage !== 'published' && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-sky-200 dark:border-sky-800 shadow-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                    </span>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      Live — best-effort updates
                    </span>
                  </div>
                  <PipelineView
                    state={activePipelineState}
                    onViewCourse={(courseId) => {
                      setActivePipelineId(null);
                      nav(`/courses/${courseId}`);
                    }}
                  />
                </div>
              )}

            {/* WIP Pipelines */}
            {pipelineList.filter(
              (p) =>
                p.id !== activePipelineId &&
                !['reviewing', 'published', 'personal'].includes(p.stage),
            ).length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="text-accent" aria-hidden>
                    <IconPipeline size={18} />
                  </span>
                  Courses In Progress
                </h2>
                <div className="space-y-2">
                  {pipelineList
                    .filter(
                      (p) =>
                        p.id !== activePipelineId &&
                        !['reviewing', 'published', 'personal'].includes(p.stage),
                    )
                    .map((p) => (
                      <Button
                        key={p.id}
                        variant="ghost"
                        fullWidth
                        onClick={() => nav(`/pipeline/${p.id}`)}
                        className="justify-start text-left gap-3 p-3 h-auto"
                      >
                        <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
                          <span className="text-accent" aria-hidden>
                            {p.stage === 'scraping' ? (
                              <IconSearch size={18} />
                            ) : p.stage === 'organizing' ? (
                              <IconPipeline size={18} />
                            ) : p.stage === 'synthesizing' ? (
                              <IconBrainSpark size={18} />
                            ) : p.stage === 'quality_check' ? (
                              <IconShieldKey size={18} />
                            ) : (
                              <IconLesson size={18} />
                            )}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {p.courseTitle || p.topic}
                          </p>
                          <p className="text-xs text-gray-800/80 dark:text-gray-200 capitalize">
                            {p.stage.replace('_', ' ')} · {p.progress}%
                          </p>
                        </div>
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-400 rounded-full transition-all"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {/* Notifications Feed */}
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-5"
              aria-live="polite"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-accent" aria-hidden>
                    <IconSpark size={18} />
                  </span>
                  Notifications
                  {state.notifications.filter((n) => !n.read).length > 0 && (
                    <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                      {state.notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </h2>
              </div>
              {state.notifications.length === 0 && state.courses.length === 0 ? (
                <p className="text-sm text-gray-800/80 dark:text-gray-200 text-center py-4">
                  No notifications yet. Create a course to get started!
                </p>
              ) : (
                <div className="space-y-2">
                  {state.notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="flex items-start gap-3 p-2 text-sm group">
                      <span className="text-accent mt-0.5" aria-hidden>
                        {n.type === 'agent' ? (
                          <IconBrainSpark size={16} />
                        ) : n.type === 'progress' ? (
                          <IconProgressRing size={16} />
                        ) : (
                          <IconSpark size={16} />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-800/90 dark:text-gray-100">{n.message}</div>
                        {(n as any).meta?.sourceDomain || (n as any).meta?.url ? (
                          <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-300">
                            <span>
                              Checked:{' '}
                              {(n as any).meta?.sourceDomain ||
                                (n as any).meta?.sourceUrl ||
                                'unknown'}
                            </span>
                            {(n as any).meta?.checkedAt ? (
                              <span> · {new Date((n as any).meta.checkedAt).toLocaleString()}</span>
                            ) : null}
                            {(n as any).meta?.explanation ? (
                              <div className="mt-0.5">Why: {(n as any).meta.explanation}</div>
                            ) : null}
                            {(n as any).meta?.url ? (
                              <div className="mt-0.5">
                                <a
                                  href={(n as any).meta.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-accent hover:underline break-all"
                                >
                                  {(n as any).meta.url}
                                </a>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-300">
                          {new Date(n.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dispatch({ type: 'DISMISS_NOTIFICATION', id: n.id })}
                          className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100"
                          aria-label="Dismiss notification"
                        >
                          <IconClose size={14} className="text-current" decorative />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {state.courses.length > 0 && (
                    <div className="flex items-center gap-3 p-2 text-sm">
                      <span className="text-accent" aria-hidden>
                        <IconCourse size={16} />
                      </span>
                      <span className="text-gray-800/80 dark:text-gray-200">
                        You have {state.courses.length} active course
                        {state.courses.length !== 1 ? 's' : ''}. Keep up the momentum!
                      </span>
                    </div>
                  )}
                  {state.completedLessons.size > 0 && (
                    <div className="flex items-center gap-3 p-2 text-sm">
                      <IconCelebrate size={16} className="text-green-500" decorative />
                      <span className="text-gray-800/80 dark:text-gray-200">
                        {state.completedLessons.size} lesson
                        {state.completedLessons.size !== 1 ? 's' : ''} completed. Great progress!
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-2 text-sm">
                    <IconFlame size={16} className="text-orange-500" decorative />
                    <span className="text-gray-700 dark:text-gray-300">
                      {state.streak === 0
                        ? 'Start your streak! Complete a lesson today.'
                        : state.streak === 1
                          ? '1-day streak! Keep it going!'
                          : `${state.streak}-day streak! Don't break the chain.`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Courses with Progress Rings */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Your Courses
                </h2>
                {state.courses.length >= 3 && (
                  <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-medium">
                    PRO — Unlimited Courses
                  </span>
                )}
              </div>
              {state.courses.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-accent/30 dark:border-accent/20 shadow-card p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <IconRocket size={34} className="text-accent" decorative />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Create your first course
                  </h3>
                  <p className="text-gray-800/80 dark:text-gray-200 text-sm max-w-md mx-auto mb-6">
                    Enter any topic above and our AI agents will research, organize, and build a
                    personalized course for you in minutes.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <Button
                      variant="primary"
                      size="large"
                      onClick={() => {
                        const el = document.querySelector<HTMLInputElement>(
                          'input[placeholder*="Enter a topic"]',
                        );
                        el?.focus();
                      }}
                    >
                      Start Learning Now
                    </Button>
                    <Button variant="secondary" onClick={() => nav('/marketplace/courses')}>
                      Browse Marketplace
                    </Button>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center">
                    {[
                      'Agentic AI',
                      'Rust Programming',
                      'Quantum Computing',
                      'Machine Learning',
                    ].map((topic) => (
                      <Button
                        key={topic}
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewTopic(topic)}
                        className="rounded-full border border-gray-200 dark:border-gray-700"
                      >
                        {topic}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  data-component="course-carousel"
                  aria-label="Your courses"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {state.courses.map((course) => {
                    const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
                    const completed = course.modules.reduce(
                      (s, m) =>
                        s + m.lessons.filter((l) => state.completedLessons.has(l.id)).length,
                      0,
                    );
                    const pct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
                    return (
                      <div
                        key={course.id}
                        role="article"
                        aria-label={course.title}
                        onClick={() => {
                          dispatch({ type: 'SET_ACTIVE_COURSE', course });
                          nav(`/courses/${course.id}`);
                        }}
                        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card hover:shadow-card-hover p-5 cursor-pointer hover:border-accent dark:hover:border-accent transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <h3
                            className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-accent transition-colors line-clamp-2 flex-1"
                            title={course.title}
                          >
                            {course.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              aria-label={`Delete course ${course.title}`}
                              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-red-600 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({ id: course.id, title: course.title });
                              }}
                            >
                              <IconTrash size={16} className="text-current" decorative />
                            </button>
                            <ProgressRing percent={pct} size={44} stroke={3} className="ml-1" />
                          </div>
                        </div>
                        <p className="text-sm text-gray-800/80 dark:text-gray-200 mb-4 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-800/80 dark:text-gray-200">
                          <span>
                            {completed}/{totalLessons} lessons
                          </span>
                          <span className="font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                            {course.depth}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Knowledge Map Preview — Spec §5.2.2 */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white inline-flex items-center gap-2">
                  <IconMap size={18} className="text-accent" decorative />
                  Knowledge Map
                </h2>
                <Button variant="ghost" size="sm" onClick={() => nav('/mindmap')}>
                  Explore →
                </Button>
              </div>
              {state.courses.length > 0 ? (
                <div className="relative h-32 bg-gradient-to-br from-accent/5 via-purple-50/50 to-blue-50/50 dark:from-accent/10 dark:via-gray-800/50 dark:to-gray-800/50 rounded-xl overflow-hidden flex items-center justify-center">
                  <svg
                    viewBox="0 0 200 100"
                    className="w-full h-full opacity-60"
                    aria-hidden="true"
                  >
                    <circle
                      cx="100"
                      cy="50"
                      r="12"
                      fill="currentColor"
                      className="text-accent"
                      opacity="0.8"
                    />
                    {state.courses.slice(0, 5).map((c: any, i: number) => {
                      const angle =
                        (i / Math.min(state.courses.length, 5)) * Math.PI * 2 - Math.PI / 2;
                      const x = 100 + Math.cos(angle) * 45;
                      const y = 50 + Math.sin(angle) * 30;
                      return (
                        <g key={c.id}>
                          <line
                            x1="100"
                            y1="50"
                            x2={x}
                            y2={y}
                            stroke="currentColor"
                            className="text-gray-300 dark:text-gray-600"
                            strokeWidth="1"
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r="6"
                            fill="currentColor"
                            className="text-accent"
                            opacity="0.5"
                          />
                        </g>
                      );
                    })}
                  </svg>
                  <p className="absolute bottom-2 text-xs text-gray-500 dark:text-gray-300">
                    {state.courses.length} topics mapped
                  </p>
                </div>
              ) : (
                <div className="h-32 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-center">
                  <p className="text-sm text-gray-400">
                    Start a course to build your knowledge map
                  </p>
                </div>
              )}
            </div>

            {/* Mindmap Overview Preview — Spec §5.2.2 */}
            <div
              onClick={() => nav('/mindmap')}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-5 cursor-pointer hover:border-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white inline-flex items-center gap-2">
                  <IconMap size={18} className="text-accent" decorative />
                  Knowledge Mindmap
                </h2>
                <span className="text-xs text-accent font-medium">View Full Map →</span>
              </div>
              <div className="flex items-center justify-center gap-6 py-4">
                {state.courses.length === 0 ? (
                  <div className="h-24 w-full bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-center">
                    <p className="text-sm text-gray-400">Start a course to build your mindmap</p>
                  </div>
                ) : (
                  <>
                    {/* Mini mindmap teaser nodes */}
                    {state.courses.slice(0, 3).map((c: any, i: number) => {
                      const colors = [
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                      ];
                      const label = String(c?.title || '');
                      return (
                        <div key={c.id || i} className="flex flex-col items-center gap-1">
                          <div
                            className={`w-14 h-14 rounded-full ${colors[i] || colors[0]} flex items-center justify-center text-lg font-bold`}
                          >
                            {(label || '?').charAt(0)}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[80px] truncate text-center">
                            {label || 'Untitled'}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Explore your course map — see course/module/lesson nodes and your progress.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <IconChatTutor size={22} />, label: 'Chat', path: '/conversation' },
                { icon: <IconMindmap size={22} />, label: 'Mind Map', path: '/mindmap' },
                {
                  icon: <IconMarketplace size={22} />,
                  label: 'Marketplace',
                  path: '/marketplace/courses',
                },
                { icon: <IconSettings size={22} />, label: 'Settings', path: '/settings' },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="ghost"
                  onClick={() => nav(action.path)}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-card p-4 text-center hover:border-accent h-auto flex-col gap-1"
                >
                  <span className="text-2xl block text-accent" aria-hidden>
                    {action.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {action.label}
                  </span>
                </Button>
              ))}
            </div>
          </>
        )}
      </main>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete course?"
        description={
          deleteTarget
            ? `This will permanently delete “${deleteTarget.title}”. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          const target = deleteTarget;
          setDeleteTarget(null);
          await deleteCourse(target.id);
        }}
      />
    </section>
  );
}
