import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.js';
import { ProgressRing } from '../components/ProgressRing.js';

export function Dashboard() {
  const nav = useNavigate();
  const { state, createCourse, dispatch } = useApp();
  const [newTopic, setNewTopic] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateCourse = async () => {
    if (!newTopic.trim()) return;
    setCreating(true);
    try {
      const course = await createCourse(newTopic.trim());
      nav(`/courses/${course.id}`);
    } catch {
      // stay on dashboard
    } finally {
      setCreating(false);
      setNewTopic('');
    }
  };

  // Dark mode toggle (Task 11)
  const toggleDarkMode = () => {
    const next = !state.profile.darkMode;
    dispatch({ type: 'UPDATE_PROFILE', profile: { darkMode: next } });
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('learnflow-dark', String(next));
  };

  // Persist dark mode on mount
  useEffect(() => {
    const saved = localStorage.getItem('learnflow-dark');
    if (saved === 'true') {
      dispatch({ type: 'UPDATE_PROFILE', profile: { darkMode: true } });
      document.documentElement.classList.add('dark');
    }
  }, []);

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
          <div className="flex items-center gap-2">
            {/* Dark mode toggle (Task 11) */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Toggle dark mode"
            >
              {state.profile.darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => nav('/conversation')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Chat"
            >
              💬
            </button>
            <button
              onClick={() => nav('/settings')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Streak & Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            data-component="streak-tracker"
            aria-label="Learning streak"
            className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-4 text-white"
          >
            <p className="text-sm font-medium opacity-90">Streak</p>
            <p className="text-3xl font-bold">{state.streak}🔥</p>
            <p className="text-xs opacity-75 mt-1">days in a row</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Courses</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {state.courses.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">active</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-3xl font-bold text-success">{state.completedLessons.size}</p>
            <p className="text-xs text-gray-400 mt-1">lessons</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
            <p className="text-3xl font-bold text-accent">0/3</p>
            <p className="text-xs text-gray-400 mt-1">daily goal</p>
          </div>
        </div>

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
                    <p className="text-xs text-gray-400 truncate">
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
          <div className="flex gap-3">
            <input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCourse()}
              placeholder="Enter a topic (e.g., Agentic AI, Rust, Quantum Computing)..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
            <button
              onClick={handleCreateCourse}
              disabled={creating || !newTopic.trim()}
              className="px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {creating ? '⏳ Creating...' : '✨ Create Course'}
            </button>
          </div>
        </div>

        {/* Notifications Feed (Task 9) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            🔔 Notifications
          </h2>
          {state.courses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No notifications yet. Create a course to get started!
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 text-sm">
                <span className="text-accent">📚</span>
                <span className="text-gray-600 dark:text-gray-400">
                  You have {state.courses.length} active course
                  {state.courses.length !== 1 ? 's' : ''}. Keep up the momentum!
                </span>
              </div>
              {state.completedLessons.size > 0 && (
                <div className="flex items-center gap-3 p-2 text-sm">
                  <span className="text-success">🎉</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {state.completedLessons.size} lesson
                    {state.completedLessons.size !== 1 ? 's' : ''} completed. Great progress!
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 p-2 text-sm">
                <span className="text-warning">🔥</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {state.streak}-day streak! Don't break the chain.
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
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <span className="text-5xl block mb-4">📚</span>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No courses yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                Create your first course above to get started
              </p>
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
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-accent transition-colors line-clamp-2 flex-1">
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
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
