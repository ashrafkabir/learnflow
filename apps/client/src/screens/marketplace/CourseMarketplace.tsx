import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../lib/routes.js';
import { apiGet, apiPost } from '../../context/AppContext.js';
import { Button } from '../../components/Button.js';
import { SkeletonMarketplace } from '../../components/Skeleton.js';
import { useToast } from '../../components/Toast.js';
import { IconBag } from '../../components/icons/index.js';

interface MarketplaceCourse {
  id: string;
  title: string;
  topic: string;
  description: string;
  difficulty: string;
  price: number;
  // MVP-safe: do not treat rating/enrollment as real metrics unless backed by real analytics.
  // (We intentionally omit these in browse UI.)
  rating?: number;
  enrollmentCount?: number;
  isDemo?: boolean;
  creatorId?: string;
  lessonCount?: number;
}

const CATEGORIES = ['All', 'Programming', 'Data Science', 'DevOps', 'Design', 'Business'];

/** Spec §7.1, §5.2.7 — Course Marketplace with API integration */
export function CourseMarketplace() {
  const nav = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [maxPrice, _setMaxPrice] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price'>('newest');
  const [courses, setCourses] = useState<MarketplaceCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const params = new URLSearchParams();
        if (search) params.set('keyword', search);
        if (topicFilter) params.set('topic', topicFilter);
        if (difficultyFilter) params.set('difficulty', difficultyFilter);
        if (maxPrice) params.set('maxPrice', maxPrice);
        const data: any = await apiGet(`/marketplace/courses?${params}`);
        if (data?.courses?.length > 0) {
          setCourses(data.courses);
        } else {
          // Do not silently fall back to sample data; show an honest empty state.
          setCourses([]);
        }
      } catch (e: any) {
        // Network failure: keep empty list and show an actionable, truthful state.
        setCourses([]);
        const msg = String(e?.message || '').trim();
        setLoadError(msg || 'Failed to load marketplace courses.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [search, difficultyFilter, topicFilter, maxPrice]);

  const filtered = courses
    .filter((c) => {
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.topic.includes(search.toLowerCase());
      const matchesDifficulty = !difficultyFilter || c.difficulty === difficultyFilter;
      const matchesCategory =
        category === 'All' || c.topic.toLowerCase() === category.toLowerCase().replace(' ', '-');
      return matchesSearch && matchesDifficulty && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      // newest: reverse by id as a stable, data-free sort
      return String(b.id).localeCompare(String(a.id));
    });

  // MVP-safe: do not feature by rating (not backed)
  const featured: MarketplaceCourse[] = [];

  const handleEnroll = async (course: MarketplaceCourse) => {
    setEnrolling(course.id);
    try {
      if (course.price > 0) {
        const start = await apiPost('/marketplace/checkout', { courseId: course.id });
        const paymentIntentId = start?.paymentIntent?.id;
        if (paymentIntentId) {
          await apiPost('/marketplace/checkout/confirm', { paymentIntentId });
        }
      }
      nav('/dashboard');
    } catch (e: any) {
      const msg = String(e?.message || '').trim();
      toast(
        `Could not enroll in "${course.title}". ${msg ? msg : 'Please try again.'}`.trim(),
        'error',
      );
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <section
      aria-label="Course Marketplace"
      data-screen="course-marketplace"
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => nav('/dashboard')}>
            ←
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white inline-flex items-center gap-2">
            <IconBag className="w-5 h-5 text-accent" />
            Course Marketplace
          </h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/50 text-sm text-amber-900 dark:text-amber-100">
          <p className="font-semibold">MVP note</p>
          <ul className="mt-1 list-disc pl-5 space-y-1">
            <li>
              Paid course checkout is currently <span className="font-semibold">mocked</span> (
              <span className="font-semibold">mock billing</span> — no real payment is processed).
            </li>
            <li>
              Ratings / enrollment counts are not shown here because they are not yet backed by
              reliable marketplace analytics.
            </li>
          </ul>
        </div>
        {/* Featured Section */}
        {!loading && featured.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              <span className="inline-flex items-center gap-2">
                <IconStar className="w-4 h-4 text-amber-400" />
                Featured Courses
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {featured.map((c) => (
                <div
                  key={c.id}
                  onClick={() => nav(`/marketplace/courses/${c.id}`)}
                  className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white cursor-pointer hover:shadow-elevated transition-all card"
                >
                  <h3 className="font-semibold mb-1">{c.title}</h3>
                  <p className="text-sm text-blue-100 line-clamp-2 mb-3">{c.description}</p>
                  <div className="flex items-center justify-between text-xs text-blue-100">
                    <span className="font-medium">{c.creator || 'Community'}</span>
                    <span className="capitalize">{c.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Chips */}
        <div className="flex flex-wrap gap-3 mb-4">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCategory(cat)}
              className={
                category !== cat
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  : ''
              }
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            aria-label="Search courses"
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            aria-label="Filter by difficulty"
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            aria-label="Filter by topic"
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="">All Topics</option>
            <option value="programming">Programming</option>
            <option value="data-science">Data Science</option>
            <option value="devops">DevOps</option>
            <option value="design">Design</option>
            <option value="business">Business</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort by"
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price">Lowest Price</option>
          </select>
        </div>

        {/* Loading skeleton */}
        {loading && <SkeletonMarketplace />}

        {/* Course grid */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {loadError ? 'Marketplace unavailable' : 'No courses found'}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {loadError
                ? loadError
                : 'This marketplace list is empty in local/dev until a creator publishes a course.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={() => nav('/dashboard')}>
                Create a course
              </Button>
              <Button variant="ghost" size="sm" onClick={() => nav(ROUTES.marketplaceCreator)}>
                Creator dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </div>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Tip: Publishing is currently available from the Creator Dashboard (requires being
              signed in).
            </p>
          </div>
        )}

        <div
          data-component="course-catalog"
          aria-live="polite"
          aria-label="Course catalog"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((c) => (
            <div
              key={c.id}
              role="article"
              aria-label={c.title}
              onClick={() => nav(`/marketplace/courses/${c.id}`)}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 cursor-pointer hover:border-accent card transition-all shadow-card"
            >
              <h3
                className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2"
                title={c.title}
              >
                {c.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 capitalize">
                {c.difficulty} · {c.topic.replace('-', ' ')}
                {c.lessonCount ? ` · ${c.lessonCount} lessons` : ''}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                {c.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {c.price === 0 ? 'Free' : `$${c.price}`}
                </span>
                {/* MVP: omit rating/enrollment metrics (not backed by real data in public router). */}
              </div>
              <Button
                variant="primary"
                fullWidth
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEnroll(c);
                }}
                disabled={enrolling === c.id}
                aria-label={`Enroll in ${c.title}`}
                className="mt-3"
              >
                {enrolling === c.id
                  ? 'Enrolling...'
                  : c.price === 0
                    ? 'Enroll Free'
                    : `Enroll — $${c.price}`}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
