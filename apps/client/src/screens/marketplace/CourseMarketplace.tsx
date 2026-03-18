import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiBase } from '../../context/AppContext.js';
import { Button } from '../../components/Button.js';
import { SkeletonMarketplace } from '../../components/Skeleton.js';

interface MarketplaceCourse {
  id: string;
  title: string;
  topic: string;
  description: string;
  difficulty: string;
  price: number;
  rating: number;
  enrollmentCount: number;
  creatorId?: string;
  lessonCount?: number;
}

const CATEGORIES = ['All', 'Programming', 'Data Science', 'DevOps', 'Design', 'Business'];

const SAMPLE_COURSES: MarketplaceCourse[] = [
  { id: 'mc-1', title: 'Machine Learning Fundamentals', description: 'A comprehensive introduction to ML concepts, algorithms, and practical applications.', topic: 'data-science', difficulty: 'beginner', price: 0, rating: 4.5, enrollmentCount: 1200, lessonCount: 12 },
  { id: 'mc-2', title: 'Advanced Python Patterns', description: 'Master design patterns, metaprogramming, and advanced Python techniques.', topic: 'programming', difficulty: 'advanced', price: 19.99, rating: 4.8, enrollmentCount: 800, lessonCount: 15 },
  { id: 'mc-3', title: 'Kubernetes in Production', description: 'Deploy, scale, and manage containerized applications in production environments.', topic: 'devops', difficulty: 'intermediate', price: 14.99, rating: 4.6, enrollmentCount: 650, lessonCount: 10 },
  { id: 'mc-4', title: 'Quantum Computing 101', description: 'Explore the fundamentals of quantum computing, qubits, and quantum algorithms.', topic: 'data-science', difficulty: 'beginner', price: 0, rating: 4.3, enrollmentCount: 420, lessonCount: 8 },
  { id: 'mc-5', title: 'React & TypeScript Masterclass', description: 'Build production-ready apps with React 19, TypeScript, and modern tooling.', topic: 'programming', difficulty: 'intermediate', price: 24.99, rating: 4.9, enrollmentCount: 2100, lessonCount: 20 },
  { id: 'mc-6', title: 'UI/UX Design Principles', description: 'Learn design thinking, wireframing, prototyping, and user research methods.', topic: 'design', difficulty: 'beginner', price: 0, rating: 4.4, enrollmentCount: 980, lessonCount: 9 },
  { id: 'mc-7', title: 'AWS Solutions Architect', description: 'Prepare for the AWS SA exam with hands-on labs covering EC2, S3, Lambda, and more.', topic: 'devops', difficulty: 'advanced', price: 29.99, rating: 4.7, enrollmentCount: 1500, lessonCount: 18 },
  { id: 'mc-8', title: 'Product Management Essentials', description: 'From roadmaps to sprints — master the PM toolkit used at top tech companies.', topic: 'business', difficulty: 'beginner', price: 9.99, rating: 4.2, enrollmentCount: 550, lessonCount: 11 },
  { id: 'mc-9', title: 'Deep Learning with PyTorch', description: 'Neural networks, CNNs, transformers, and GANs with practical PyTorch projects.', topic: 'data-science', difficulty: 'advanced', price: 34.99, rating: 4.8, enrollmentCount: 870, lessonCount: 16 },
  { id: 'mc-10', title: 'Figma for Developers', description: 'Bridge the design-dev gap. Learn Figma auto-layout, tokens, and handoff workflows.', topic: 'design', difficulty: 'intermediate', price: 0, rating: 4.5, enrollmentCount: 720, lessonCount: 7 },
];

/** Spec §7.1, §5.2.7 — Course Marketplace with API integration */
export function CourseMarketplace() {
  const nav = useNavigate();
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [maxPrice, _setMaxPrice] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest' | 'price'>('popular');
  const [courses, setCourses] = useState<MarketplaceCourse[]>(SAMPLE_COURSES);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('keyword', search);
        if (topicFilter) params.set('topic', topicFilter);
        if (difficultyFilter) params.set('difficulty', difficultyFilter);
        if (maxPrice) params.set('maxPrice', maxPrice);
        const res = await fetch(`/api/v1/marketplace/courses?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (data.courses?.length > 0) {
            setCourses(data.courses);
          } else {
            setCourses(SAMPLE_COURSES);
          }
        }
      } catch {
        setCourses(SAMPLE_COURSES);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [search, difficultyFilter, topicFilter, maxPrice]);

  const filtered = courses.filter((c) => {
    const matchesSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.topic.includes(search.toLowerCase());
    const matchesDifficulty = !difficultyFilter || c.difficulty === difficultyFilter;
    const matchesCategory = category === 'All' || c.topic.toLowerCase() === category.toLowerCase().replace(' ', '-');
    return matchesSearch && matchesDifficulty && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'popular') return b.enrollmentCount - a.enrollmentCount;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price') return a.price - b.price;
    return 0;
  });

  const featured = courses.filter(c => c.rating >= 4.7).slice(0, 3);

  const handleEnroll = async (course: MarketplaceCourse) => {
    setEnrolling(course.id);
    try {
      const token = localStorage.getItem('learnflow-token');
      if (course.price > 0 && token) {
        await fetch(`${apiBase()}/api/v1/marketplace/checkout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: course.id }),
        });
      }
      nav('/dashboard');
    } catch {
      // silent fail
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
          <Button variant="ghost" size="sm" onClick={() => nav('/dashboard')}>←</Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">🏪 Course Marketplace</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Featured Section */}
        {!loading && featured.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">⭐ Featured Courses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {featured.map(c => (
                <div key={c.id} onClick={() => nav(`/marketplace/courses/${c.id}`)} className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white cursor-pointer hover:shadow-elevated transition-all card">
                  <h3 className="font-semibold mb-1">{c.title}</h3>
                  <p className="text-sm text-blue-100 line-clamp-2 mb-3">{c.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span>⭐ {c.rating}</span>
                    <span>{c.enrollmentCount.toLocaleString()} enrolled</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Chips */}
        <div className="flex flex-wrap gap-3 mb-4">
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              variant={category === cat ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCategory(cat)}
              className={category !== cat ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : ''}
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
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
            <option value="price">Lowest Price</option>
          </select>
        </div>

        {/* Loading skeleton */}
        {loading && <SkeletonMarketplace />}

        {/* Course grid */}
        <div
            data-component="course-catalog"
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
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2" title={c.title}>{c.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 capitalize">{c.difficulty} · {c.topic.replace('-', ' ')}{c.lessonCount ? ` · ${c.lessonCount} lessons` : ''}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">{c.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {c.price === 0 ? 'Free' : `$${c.price}`}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">⭐ {c.rating} · {c.enrollmentCount} enrolled</span>
                </div>
                <Button
                  variant="primary"
                  fullWidth
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleEnroll(c); }}
                  disabled={enrolling === c.id}
                  aria-label={`Enroll in ${c.title}`}
                  className="mt-3"
                >
                  {enrolling === c.id ? 'Enrolling...' : c.price === 0 ? 'Enroll Free' : `Enroll — $${c.price}`}
                </Button>
              </div>
            ))}
          </div>
      </div>
    </section>
  );
}
