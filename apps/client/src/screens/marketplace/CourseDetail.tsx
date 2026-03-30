import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiPost } from '../../context/AppContext.js';
import { Button } from '../../components/Button.js';
import { SkeletonMarketplace } from '../../components/Skeleton.js';
import { IconCourse, IconStar } from '../../components/icons/index.js';

interface CourseDetailData {
  id: string;
  title: string;
  topic: string;
  description: string;
  difficulty: string;
  price: number;
  // MVP honesty: these fields may exist server-side but should not be shown as real analytics yet.
  rating?: number;
  enrollmentCount?: number;
  lessonCount?: number;
  creatorName?: string;
  creatorAvatar?: string;
  syllabus?: { module: string; lessons: string[] }[];
  reviews?: { author: string; rating: number; text: string; date: string }[];
}

const SAMPLE_COURSES: Record<string, CourseDetailData> = {};

function getFallbackDetail(id: string): CourseDetailData {
  return (
    SAMPLE_COURSES[id] || {
      id,
      title: 'Course',
      description: 'Course details loading...',
      topic: 'general',
      difficulty: 'beginner',
      price: 0,
      syllabus: [],
      reviews: [],
    }
  );
}

/** Spec §5.2.7 — Course Detail Page */
export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const nav = useNavigate();
  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

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
      const start = await apiPost('/marketplace/checkout', { courseId: course.id });
      const paymentIntentId = start?.paymentIntent?.id;
      if (paymentIntentId) {
        await apiPost('/marketplace/checkout/confirm', { paymentIntentId });
      }
      nav('/dashboard');
    } catch {
      // silent
    } finally {
      setEnrolling(false);
    }
  };

  const submitReview = async () => {
    if (!course) return;
    setReviewSubmitting(true);
    try {
      await apiPost(`/marketplace/courses/${course.id}/reviews`, {
        rating: reviewRating,
        text: reviewText,
      });
      const res = await fetch(`/api/v1/marketplace/courses/${course.id}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data.course || getFallbackDetail(course.id));
      }
      setReviewText('');
    } catch {
      // silent MVP
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-3xl mx-auto">
          <SkeletonMarketplace />
        </div>
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
      {/* NOTE: Marketplace checkout is currently in MOCK mode (instant success) for MVP/testing. */}
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => nav('/marketplace')}>
            ← Back
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Title & Meta */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${course.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : course.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}
            >
              {course.difficulty}
            </span>
            <span className="text-xs text-gray-500 capitalize">
              {course.topic.replace('-', ' ')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {course.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{course.description}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-300 mb-4">
            {/* MVP honesty: do not show ratings/enrollment counts until backed by real analytics */}
            {course.lessonCount && <span>{course.lessonCount} lessons</span>}
          </div>

          {/* Creator */}
          {course.creatorName && (
            <div className="flex items-center gap-3 py-3 border-t border-gray-100 dark:border-gray-800">
              <span className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <IconCourse className="w-5 h-5 text-gray-600 dark:text-gray-200" />
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {course.creatorName}
                </p>
                <p className="text-xs text-gray-500">Course Creator</p>
              </div>
            </div>
          )}

          {/* Price + Enroll */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            {course.price > 0 && (
              <>
                <span className="text-[11px] px-2 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/40">
                  Mock checkout (no real payment)
                </span>
                <span className="text-[11px] px-2 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/40">
                  Mock billing
                </span>
              </>
            )}
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {course.price === 0 ? 'Free' : `$${course.price}`}
            </span>
            <Button
              variant="primary"
              size="large"
              onClick={handleEnroll}
              disabled={enrolling}
              className="flex-1"
            >
              {enrolling
                ? 'Enrolling...'
                : course.price === 0
                  ? 'Enroll Free'
                  : `Enroll — $${course.price}`}
            </Button>
          </div>
        </div>

        {/* Syllabus */}
        {course.syllabus && course.syllabus.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-card">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
              <IconCourse className="w-5 h-5 text-accent" />
              Syllabus
            </h2>
            <div className="space-y-2">
              {course.syllabus.map((mod, idx) => (
                <div
                  key={idx}
                  className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden"
                >
                  <Button
                    variant="ghost"
                    onClick={() => toggleModule(idx)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors h-auto rounded-none"
                  >
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Module {idx + 1}: {mod.module}
                    </span>
                    <span className="text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        {mod.lessons.length} lessons
                        {expandedModules.has(idx) ? '▴' : '▾'}
                      </span>
                    </span>
                  </Button>
                  {expandedModules.has(idx) && (
                    <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 space-y-1">
                      {mod.lessons.map((lesson, li) => (
                        <div
                          key={li}
                          className="flex items-center gap-2 py-1.5 text-sm text-gray-600 dark:text-gray-300"
                        >
                          <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs">
                            {li + 1}
                          </span>
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-card">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 inline-flex items-center gap-2">
            <IconStar className="w-5 h-5 text-accent" />
            Reviews
          </h2>

          {/* Write a review (MVP) */}
          <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Leave a review
              </span>
              <span className="text-xs text-gray-500">(requires login)</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 dark:text-gray-300" htmlFor="rating">
                Rating
              </label>
              <select
                id="rating"
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-xs text-yellow-500 inline-flex items-center gap-1">
                <IconStar className="w-3.5 h-3.5" />
                <span>{reviewRating}</span>
              </span>
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you like? What could be improved?"
              className="w-full min-h-[84px] text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <div className="flex justify-end mt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={submitReview}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? 'Submitting…' : 'Submit review'}
              </Button>
            </div>
          </div>

          {course.reviews && course.reviews.length > 0 ? (
            <div className="space-y-4">
              {course.reviews.map((r, idx) => (
                <div
                  key={idx}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {r.author}
                    </span>
                    <span className="text-xs text-gray-500">{r.date}</span>
                  </div>
                  <div className="text-xs text-yellow-500 mb-1 inline-flex items-center gap-1">
                    <IconStar className="w-3.5 h-3.5" />
                    <span>
                      {r.rating}
                      <span className="sr-only"> out of 5</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{r.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-300">No reviews yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
