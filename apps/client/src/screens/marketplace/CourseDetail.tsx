import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiBase } from '../../context/AppContext.js';
import { Button } from '../../components/Button.js';
import { SkeletonMarketplace } from '../../components/Skeleton.js';

interface CourseDetailData {
  id: string;
  title: string;
  topic: string;
  description: string;
  difficulty: string;
  price: number;
  rating: number;
  enrollmentCount: number;
  lessonCount?: number;
  creatorName?: string;
  creatorAvatar?: string;
  syllabus?: { module: string; lessons: string[] }[];
  reviews?: { author: string; rating: number; text: string; date: string }[];
}

const SAMPLE_COURSES: Record<string, CourseDetailData> = {
  'mc-1': { id: 'mc-1', title: 'Machine Learning Fundamentals', description: 'A comprehensive introduction to ML concepts, algorithms, and practical applications. Covers supervised and unsupervised learning, neural networks, and real-world projects.', topic: 'data-science', difficulty: 'beginner', price: 0, rating: 4.5, enrollmentCount: 1200, lessonCount: 12, creatorName: 'Dr. Sarah Chen', creatorAvatar: '👩‍🔬', syllabus: [{ module: 'Introduction to ML', lessons: ['What is Machine Learning?', 'Types of ML', 'Setting Up Your Environment'] }, { module: 'Supervised Learning', lessons: ['Linear Regression', 'Classification', 'Decision Trees', 'Model Evaluation'] }, { module: 'Neural Networks', lessons: ['Perceptrons', 'Backpropagation', 'CNNs', 'Practical Projects'] }], reviews: [{ author: 'Alex R.', rating: 5, text: 'Excellent intro course. Clear explanations and great projects.', date: '2025-06-15' }, { author: 'Mika T.', rating: 4, text: 'Good content, wish there were more exercises.', date: '2025-06-10' }] },
  'mc-2': { id: 'mc-2', title: 'Advanced Python Patterns', description: 'Master design patterns, metaprogramming, and advanced Python techniques for production code.', topic: 'programming', difficulty: 'advanced', price: 19.99, rating: 4.8, enrollmentCount: 800, lessonCount: 15, creatorName: 'Marcus Dev', creatorAvatar: '👨‍💻', syllabus: [{ module: 'Design Patterns', lessons: ['Singleton', 'Factory', 'Observer', 'Strategy'] }, { module: 'Metaprogramming', lessons: ['Decorators', 'Metaclasses', 'Descriptors'] }, { module: 'Performance', lessons: ['Profiling', 'Concurrency', 'C Extensions'] }], reviews: [{ author: 'Jordan K.', rating: 5, text: 'Deep dive into Python. Highly recommend for experienced devs.', date: '2025-07-01' }] },
  'mc-3': { id: 'mc-3', title: 'Kubernetes in Production', description: 'Deploy, scale, and manage containerized applications in production environments.', topic: 'devops', difficulty: 'intermediate', price: 14.99, rating: 4.6, enrollmentCount: 650, lessonCount: 10, creatorName: 'Ops Team', creatorAvatar: '⚙️', syllabus: [{ module: 'Core Concepts', lessons: ['Pods & Services', 'Deployments', 'ConfigMaps & Secrets'] }, { module: 'Production Ready', lessons: ['Monitoring', 'Scaling', 'Security', 'CI/CD'] }], reviews: [] },
  'mc-5': { id: 'mc-5', title: 'React & TypeScript Masterclass', description: 'Build production-ready apps with React 19, TypeScript, and modern tooling.', topic: 'programming', difficulty: 'intermediate', price: 24.99, rating: 4.9, enrollmentCount: 2100, lessonCount: 20, creatorName: 'Frontend Academy', creatorAvatar: '⚛️', syllabus: [{ module: 'TypeScript Foundations', lessons: ['Types & Interfaces', 'Generics', 'Utility Types'] }, { module: 'React Patterns', lessons: ['Hooks Deep Dive', 'Server Components', 'Suspense & Streaming'] }, { module: 'Production', lessons: ['Testing', 'Performance', 'Deployment'] }], reviews: [{ author: 'Priya S.', rating: 5, text: 'Best React course I have taken. Period.', date: '2025-07-10' }] },
};

function getFallbackDetail(id: string): CourseDetailData {
  return SAMPLE_COURSES[id] || {
    id,
    title: 'Course',
    description: 'Course details loading...',
    topic: 'general',
    difficulty: 'beginner',
    price: 0,
    rating: 4.0,
    enrollmentCount: 0,
    syllabus: [],
    reviews: [],
  };
}

/** Spec §5.2.7 — Course Detail Page */
export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const nav = useNavigate();
  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/marketplace/courses/${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setCourse(data.course || getFallbackDetail(courseId || ''));
        } else {
          setCourse(getFallbackDetail(courseId || ''));
        }
      } catch {
        setCourse(getFallbackDetail(courseId || ''));
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [courseId]);

  const toggleModule = (idx: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleEnroll = async () => {
    if (!course) return;
    setEnrolling(true);
    try {
      const token = localStorage.getItem('learnflow-token');
      if (token) {
        await fetch(`${apiBase()}/api/v1/marketplace/checkout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: course.id }),
        });
      }
      nav('/dashboard');
    } catch {
      // silent
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-3xl mx-auto"><SkeletonMarketplace /></div>
      </section>
    );
  }

  if (!course) return null;

  return (
    <section
      aria-label={`Course: ${course.title}`}
      data-screen="course-detail"
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => nav('/marketplace')}>← Back</Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Title & Meta */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${course.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : course.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
              {course.difficulty}
            </span>
            <span className="text-xs text-gray-500 capitalize">{course.topic.replace('-', ' ')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span>⭐ {course.rating}</span>
            <span>{course.enrollmentCount.toLocaleString()} enrolled</span>
            {course.lessonCount && <span>{course.lessonCount} lessons</span>}
          </div>

          {/* Creator */}
          {course.creatorName && (
            <div className="flex items-center gap-3 py-3 border-t border-gray-100 dark:border-gray-800">
              <span className="text-2xl">{course.creatorAvatar || '👤'}</span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{course.creatorName}</p>
                <p className="text-xs text-gray-500">Course Creator</p>
              </div>
            </div>
          )}

          {/* Price + Enroll */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {course.price === 0 ? 'Free' : `$${course.price}`}
            </span>
            <Button variant="primary" size="large" onClick={handleEnroll} disabled={enrolling} className="flex-1">
              {enrolling ? 'Enrolling...' : course.price === 0 ? 'Enroll Free' : `Enroll — $${course.price}`}
            </Button>
          </div>
        </div>

        {/* Syllabus */}
        {course.syllabus && course.syllabus.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-card">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📚 Syllabus</h2>
            <div className="space-y-2">
              {course.syllabus.map((mod, idx) => (
                <div key={idx} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                  <Button
                    variant="ghost"
                    onClick={() => toggleModule(idx)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors h-auto rounded-none"
                  >
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Module {idx + 1}: {mod.module}
                    </span>
                    <span className="text-xs text-gray-500">{mod.lessons.length} lessons {expandedModules.has(idx) ? '▲' : '▼'}</span>
                  </Button>
                  {expandedModules.has(idx) && (
                    <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 space-y-1">
                      {mod.lessons.map((lesson, li) => (
                        <div key={li} className="flex items-center gap-2 py-1.5 text-sm text-gray-600 dark:text-gray-400">
                          <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs">{li + 1}</span>
                          {lesson}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {course.reviews && course.reviews.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-card">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">💬 Reviews</h2>
            <div className="space-y-4">
              {course.reviews.map((r, idx) => (
                <div key={idx} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{r.author}</span>
                    <span className="text-xs text-gray-500">{r.date}</span>
                  </div>
                  <div className="text-xs text-yellow-500 mb-1">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
