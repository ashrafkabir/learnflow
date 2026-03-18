import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, apiGet } from '../context/AppContext.js';
import { ProgressRing } from '../components/ProgressRing.js';
import { useStartPipeline, usePipelineList } from '../hooks/usePipeline.js';
import { useTheme } from '../design-system/ThemeProvider.js';
import { PipelineView } from '../components/pipeline/PipelineView.js';
import { usePipeline } from '../hooks/usePipeline.js';

export function Dashboard() {
  const nav = useNavigate();
  const { state, dispatch } = useApp();
  const [newTopic, setNewTopic] = useState('');
  const [creating, setCreating] = useState(false);
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<Array<{ day: string; minutes: number }>>([]);
  const { start: startPipeline, loading: pipelineLoading } = useStartPipeline();
  const { pipelines: pipelineList, refresh: refreshPipelines } = usePipelineList();
  const { state: activePipelineState } = usePipeline(activePipelineId);

  const FREE_COURSE_LIMIT = 3;
  const canCreateCourse = state.subscription === 'pro' || state.courses.length < FREE_COURSE_LIMIT;

  const handleCreateCourse = async () => {
    if (!newTopic.trim()) return;
    if (!canCreateCourse) {
      alert('Free plan is limited to 3 courses. Upgrade to Pro for unlimited courses!');
      nav('/settings');
      return;
    }
    setCreating(true);
    try {
      const result = await startPipeline(newTopic.trim());
      if (result) {
        setActivePipelineId(result.pipelineId);
        refreshPipelines();
      }
    } catch {
      // stay on dashboard
    } finally {
      setCreating(false);
      setNewTopic('');
    }
  };

  // Fetch analytics on mount (Task 2) — uses shared apiGet helper
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet('/analytics');
        dispatch({ type: 'SET_ANALYTICS', streak: data.currentStreak || 0, totalStudyMinutes: data.totalStudyMinutes || 0, totalLessonsCompleted: data.totalLessonsCompleted || 0 });
        if (data.weeklyProgress) setWeeklyData(data.weeklyProgress);
      } catch { /* ignore */ }
    })();
  }, []);

  // Fetch courses on mount — uses shared apiGet helper
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet('/courses');
        if (data.courses && data.courses.length > 0) {
          const fullCourses = await Promise.all(
            data.courses.map(async (c: { id: string }) => {
              try { return await apiGet(`/courses/${c.id}`); } catch { return null; }
            })
          );
          const valid = fullCourses.filter(Boolean);
          if (valid.length > 0) dispatch({ type: 'SET_COURSES', courses: valid });
        }
      } catch { /* ignore */ }
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
      // Pipeline completed — fetch the created course
      const fetchNewCourse = async () => {
        try {
          const data = await apiGet('/courses');
          if (data.courses) {
            for (const c of data.courses) {
              try {
                const course = await apiGet(`/courses/${c.id}`);
                dispatch({ type: 'ADD_COURSE', course });
              } catch { /* ignore */ }
            }
          }
        } catch { /* ignore */ }
      };
      fetchNewCourse();
    }
  }, [activePipelineState?.stage]);

  // Dark mode toggle — uses global ThemeProvider
  const { mode: themeMode, toggle: toggleDarkMode } = useTheme();

  // Today's lessons (Task 9) — pick next incomplete lessons across courses
  const todaysLessons: Array<{
    courseId: string;
    courseTitle: string;
    lessonId: string;
    lessonTitle: string;
    estimatedTime: number;
  }> = [];
  for (const course of state.courses) {
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (!state.completedLessons.has(lesson.id) && todaysLessons.length < 3) {
          todaysLessons.push({
            courseId: course.id,
            courseTitle: course.title,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            estimatedTime: lesson.estimatedTime,
          });
        }
      }
    }
  }

  return (
    <section
      aria-label="Dashboard"
      data-screen="dashboard"
      className="min-h-screen bg-gray-50 dark:bg-bg-dark"
    >
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              LearnFlow
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Toggle dark mode"
            >
              {themeMode === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => nav('/conversation')}
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Chat"
            >
              💬
            </button>
            <button
              onClick={() => nav('/settings')}
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hero CTA — Task 3 */}
        {todaysLessons.length > 0 ? (
          <div className="bg-gradient-to-r from-accent to-accent-dark rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-accent/20">
            <p className="text-sm font-medium opacity-80 mb-1">Continue Learning</p>
            <h2 className="text-xl sm:text-2xl font-bold mb-1">{todaysLessons[0].lessonTitle}</h2>
            <p className="text-sm opacity-75 mb-4">
              {todaysLessons[0].courseTitle} · {todaysLessons[0].estimatedTime} min
            </p>
            <button
              onClick={() => nav(`/courses/${todaysLessons[0].courseId}/lessons/${todaysLessons[0].lessonId}`)}
              className="px-6 py-3 bg-white text-accent font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-sm text-sm"
            >
              Resume →
            </button>
          </div>
        ) : state.courses.length === 0 ? (
          <div className="bg-gradient-to-r from-accent to-accent-dark rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-accent/20">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Start Your Learning Journey</h2>
            <p className="text-sm opacity-80 mb-4">
              Enter any topic and our AI agents will build a personalized course for you in minutes.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {['Agentic AI', 'Rust Programming', 'Quantum Computing'].map((t) => (
                <button
                  key={t}
                  onClick={() => setNewTopic(t)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                const el = document.querySelector<HTMLInputElement>('input[placeholder*="Enter a topic"]');
                el?.focus();
              }}
              className="px-6 py-3 bg-white text-accent font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-sm text-sm"
            >
              Create Your First Course
            </button>
          </div>
        ) : null}

        {/* Streak & Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            data-component="streak-tracker"
            aria-label="Learning streak"
            className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-4 text-white card stat-animate"
          >
            <p className="text-sm font-medium opacity-90">Streak</p>
            <p className="text-3xl font-bold"><span className="flame-flicker">🔥</span> {state.streak}</p>
            <p className="text-xs opacity-75 mt-1">days in a row</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 card stat-animate stat-animate-delay-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">Courses</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {state.courses.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">active</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 card stat-animate stat-animate-delay-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            <p className="text-3xl font-bold text-success">{state.completedLessons.size}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">lessons</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 card stat-animate stat-animate-delay-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
            <p className="text-3xl font-bold text-accent">0/3</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">daily goal</p>
          </div>
        </div>

        {/* Review Queue (Spaced Repetition) */}
        {state.completedLessons.size > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 card">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review Queue</h2>
              <span className="bg-accent/10 text-accent text-xs font-bold px-2 py-0.5 rounded-full">
                {Math.min(state.completedLessons.size, 3)} due
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Spaced repetition keeps knowledge fresh. Review these lessons today.</p>
            <div className="space-y-2">
              {state.courses.slice(0, 2).flatMap(c =>
                (c.modules || []).flatMap(m => m.lessons || []).filter((l: {id: string; title: string}) => state.completedLessons.has(l.id)).slice(0, 2).map((l: {id: string; title: string}) => (
                  <button
                    key={l.id}
                    onClick={() => window.location.href = `/courses/${c.id}/lessons/${l.id}`}
                    className="w-full text-left px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-sm"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">🔄 {l.title}</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">— Review due</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Weekly Progress Chart */}
        {weeklyData.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">This Week</h2>
            {(() => {
              const maxMin = Math.max(...weeklyData.map(d => d.minutes), 1);
              const hasData = weeklyData.some(d => d.minutes > 0);
              if (!hasData) return (
                <div className="text-center py-6">
                  <div className="flex items-end justify-center gap-2 h-20 mb-4 opacity-20">
                    {['M','T','W','T','F','S','S'].map((d, i) => (
                      <div key={d+i} className="flex-1 max-w-8">
                        <div className="bg-gray-300 dark:bg-gray-600 rounded-t-md" style={{ height: `${20 + Math.random() * 40}px` }} />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">No activity yet this week</p>
                  {todaysLessons.length > 0 ? (
                    <button
                      onClick={() => nav(`/courses/${todaysLessons[0].courseId}/lessons/${todaysLessons[0].lessonId}`)}
                      className="text-sm text-accent font-medium hover:underline"
                    >
                      Complete your first lesson to see activity here →
                    </button>
                  ) : (
                    <button
                      onClick={() => { const el = document.querySelector<HTMLInputElement>('input[placeholder*="Enter a topic"]'); el?.focus(); }}
                      className="text-sm text-accent font-medium hover:underline"
                    >
                      Create a course to get started →
                    </button>
                  )}
                </div>
              );
              return (
                <div className="flex items-end gap-2 h-32">
                  {weeklyData.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-600 dark:text-gray-400">{d.minutes > 0 ? `${d.minutes}m` : ''}</span>
                      <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                        <div
                          className="w-full bg-accent/80 rounded-t-md transition-all duration-500"
                          style={{ height: `${Math.max((d.minutes / maxMin) * 100, d.minutes > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">{d.day}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Today's Lessons (Task 9) */}
        {todaysLessons.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📅 Today's Lessons
            </h2>
            <div className="space-y-2">
              {todaysLessons.map((tl, i) => (
                <button
                  key={tl.lessonId}
                  onClick={() => nav(`/courses/${tl.courseId}/lessons/${tl.lessonId}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <span className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-sm flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {tl.lessonTitle}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {tl.courseTitle} · {tl.estimatedTime} min
                    </p>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* New Course */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Start Learning Something New
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCourse()}
              placeholder="Enter a topic (e.g., Agentic AI, Rust, Quantum Computing)..."
              className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
            <button
              onClick={handleCreateCourse}
              disabled={creating || pipelineLoading || !newTopic.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm whitespace-nowrap"
            >
              {creating || pipelineLoading ? '⏳ Starting...' : '✨ Create Course'}
            </button>
          </div>
        </div>

        {/* Active Pipeline */}
        {activePipelineState && activePipelineState.stage !== 'reviewing' && activePipelineState.stage !== 'published' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-sky-200 dark:border-sky-800 p-5">
            <PipelineView
              state={activePipelineState}
              onViewCourse={(courseId) => {
                setActivePipelineId(null);
                nav(`/courses/${courseId}`);
              }}
            />
          </div>
        )}

        {/* WIP Pipelines (from other sessions or previous) */}
        {pipelineList.filter(p => p.id !== activePipelineId && !['reviewing', 'published', 'personal'].includes(p.stage)).length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              🔄 Courses In Progress
            </h2>
            <div className="space-y-2">
              {pipelineList
                .filter(p => p.id !== activePipelineId && !['reviewing', 'published', 'personal'].includes(p.stage))
                .map(p => (
                  <button
                    key={p.id}
                    onClick={() => nav(`/pipeline/${p.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
                      <span className="text-lg">
                        {p.stage === 'scraping' ? '🔍' : p.stage === 'organizing' ? '📊' : p.stage === 'synthesizing' ? '🤖' : p.stage === 'quality_check' ? '✅' : '📝'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {p.courseTitle || p.topic}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{p.stage.replace('_', ' ')} · {p.progress}%</p>
                    </div>
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-400 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Notifications Feed — Spec §5.2.2 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              🔔 Notifications
              {state.notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  {state.notifications.filter(n => !n.read).length}
                </span>
              )}
            </h2>
          </div>
          {state.notifications.length === 0 && state.courses.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
              No notifications yet. Create a course to get started!
            </p>
          ) : (
            <div className="space-y-2">
              {/* Real-time notifications from state */}
              {state.notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-center gap-3 p-2 text-sm group">
                  <span>{n.type === 'agent' ? '🤖' : n.type === 'progress' ? '📈' : '💡'}</span>
                  <span className="flex-1 text-gray-600 dark:text-gray-400">{n.message}</span>
                  <span className="text-xs text-gray-300">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <button
                    onClick={() => dispatch({ type: 'DISMISS_NOTIFICATION', id: n.id })}
                    className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {/* Static contextual notifications */}
              {state.courses.length > 0 && (
                <div className="flex items-center gap-3 p-2 text-sm">
                  <span className="text-blue-500">📚</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    You have {state.courses.length} active course{state.courses.length !== 1 ? 's' : ''}. Keep up the momentum!
                  </span>
                </div>
              )}
              {state.completedLessons.size > 0 && (
                <div className="flex items-center gap-3 p-2 text-sm">
                  <span className="text-green-500">🎉</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {state.completedLessons.size} lesson{state.completedLessons.size !== 1 ? 's' : ''} completed. Great progress!
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 p-2 text-sm">
                <span className="text-orange-500">🔥</span>
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

        {/* Courses with Progress Rings (Task 9) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Courses</h2>
            {/* Pro badge (Task 14) */}
            {state.courses.length >= 3 && (
              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-medium">
                PRO — Unlimited Courses
              </span>
            )}
          </div>
          {state.courses.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-accent/30 dark:border-accent/20 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
                <span className="text-4xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create your first course</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto mb-6">
                Enter any topic above and our AI agents will research, organize, and build a personalized course for you in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={() => {
                    const el = document.querySelector<HTMLInputElement>('input[placeholder*="Enter a topic"]');
                    el?.focus();
                  }}
                  className="px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-dark transition-colors shadow-lg shadow-accent/25"
                >
                  Start Learning Now
                </button>
                <button
                  onClick={() => nav('/marketplace/courses')}
                  className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-accent hover:text-accent transition-colors"
                >
                  Browse Marketplace
                </button>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {['Agentic AI', 'Rust Programming', 'Quantum Computing', 'Machine Learning'].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setNewTopic(topic)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent hover:text-accent transition-all"
                  >
                    {topic}
                  </button>
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
                  (s, m) => s + m.lessons.filter((l) => state.completedLessons.has(l.id)).length,
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
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 cursor-pointer hover:border-accent dark:hover:border-accent hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-accent transition-colors line-clamp-2 flex-1" title={course.title}>
                        {course.title}
                      </h3>
                      {/* Progress Ring (Task 9) */}
                      <ProgressRing
                        percent={pct}
                        size={44}
                        stroke={3}
                        className="ml-3 flex-shrink-0"
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
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

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => nav('/conversation')}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center hover:border-accent transition-all group"
          >
            <span className="text-2xl block mb-1">💬</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-accent">
              Chat
            </span>
          </button>
          <button
            onClick={() => nav('/mindmap')}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center hover:border-accent transition-all group"
          >
            <span className="text-2xl block mb-1">🗺️</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-accent">
              Mind Map
            </span>
          </button>
          <button
            onClick={() => nav('/marketplace/courses')}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center hover:border-accent transition-all group"
          >
            <span className="text-2xl block mb-1">🏪</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-accent">
              Marketplace
            </span>
          </button>
          <button
            onClick={() => nav('/settings')}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center hover:border-accent transition-all group"
          >
            <span className="text-2xl block mb-1">⚙️</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-accent">
              Settings
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
